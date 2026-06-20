import { Request, Response } from 'express';
import HelpRequest from '../models/HelpRequest';
import User from '../models/User';
import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

let publicKey = process.env.VAPID_PUBLIC_KEY || '';
let privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (!publicKey || !privateKey) {
  try {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    console.warn('⚠️ WARNING: VAPID keys not configured in environment. Generated temporary fallback VAPID keys for development.');
  } catch (err: any) {
    console.error('Failed to generate fallback VAPID keys:', err.message);
  }
}

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:support@sanjivanisync.com',
    publicKey,
    privateKey
  );
}

interface AuthRequest extends Request {
  user?: any;
}

// 1. Create Help Request (Get Help)
export const createHelpRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { helpType, description, urgency, location } = req.body;

    if (!helpType || !description || !location || !location.coordinates) {
      res.status(400).json({ message: 'helpType, description, and location with coordinates are required' });
      return;
    }

    const helpRequest = await HelpRequest.create({
      requester: req.user.id,
      helpType,
      description,
      urgency: urgency || 'medium',
      location: {
        address: location.address || 'Emergency Location',
        coordinates: {
          type: 'Point',
          coordinates: location.coordinates, // [longitude, latitude]
        },
      },
      status: 'pending',
    });

    // Populate requester to send their name in the notification
    const populatedRequest = await HelpRequest.findById(helpRequest._id).populate('requester', 'name');

    // Notify online helpers who can help with this type
    const helpers = await User.find({
      isOnline: true,
      helpTypes: helpType,
      _id: { $ne: req.user.id }
    });

    // We configure web-push at the top of the file
    const requesterName = (populatedRequest?.requester as any)?.name || 'Someone';
    const payload = JSON.stringify({
      title: 'New Emergency Request!',
      body: `${requesterName} needs ${helpType} nearby.`,
      icon: '/icon-192x192.png',
      data: { url: '/#/dashboard?tab=notifications' }
    });

    const notifications = [];
    for (const helper of helpers) {
      if (helper.pushSubscriptions && helper.pushSubscriptions.length > 0) {
        for (const sub of helper.pushSubscriptions) {
          notifications.push(
            webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err))
          );
        }
      }
    }
    
    await Promise.all(notifications);

    res.status(201).json({
      message: 'Emergency help request created successfully',
      helpRequest,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 2. Fetch Help Requests Feed (Do Help)
export const getHelpRequestsFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // "In do help user can list himself online or offline. If he is online the listings of help will come to him for acceptation. But if offline then empty."
    if (!user.isOnline) {
      res.json([]);
      return;
    }

    // Filter pending requests matching the helper's capabilities
    const query: any = { status: 'pending' };
    if (user.helpTypes && user.helpTypes.length > 0) {
      query.helpType = { $in: user.helpTypes };
    }

    let requests;
    const hasCoordinates = user.location?.coordinates?.coordinates &&
      (user.location.coordinates.coordinates[0] !== 0 || user.location.coordinates.coordinates[1] !== 0);

    if (hasCoordinates) {
      try {
        // Find pending requests sorted by proximity to the helper's location
        requests = await HelpRequest.find({
          ...query,
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: user.location.coordinates.coordinates,
              },
            },
          },
        }).populate('requester', 'name email contactNumber location');
      } catch (geoError) {
        // Fallback to recency sort if geo query fails (e.g. index issue)
        requests = await HelpRequest.find(query)
          .sort({ createdAt: -1 })
          .populate('requester', 'name email contactNumber location');
      }
    } else {
      requests = await HelpRequest.find(query)
        .sort({ createdAt: -1 })
        .populate('requester', 'name email contactNumber location');
    }

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. Accept Help Request
export const acceptHelpRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const helpRequest = await HelpRequest.findById(id);

    if (!helpRequest) {
      res.status(404).json({ message: 'Help request not found' });
      return;
    }

    if (helpRequest.status !== 'pending') {
      res.status(400).json({ message: `Request cannot be accepted. Current status: ${helpRequest.status}` });
      return;
    }

    // Prevent accepting one's own help request
    if (helpRequest.requester.toString() === req.user.id) {
      res.status(400).json({ message: 'You cannot accept your own emergency request' });
      return;
    }

    helpRequest.status = 'accepted';
    helpRequest.helper = req.user.id;
    await helpRequest.save();

    // Populate helper details for response
    const updatedRequest = await HelpRequest.findById(id)
      .populate('requester', 'name email contactNumber location')
      .populate('helper', 'name email contactNumber location orgType');

    res.json({
      message: 'Emergency request accepted successfully',
      helpRequest: updatedRequest,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 4. Resolve Help Request
export const resolveHelpRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const helpRequest = await HelpRequest.findById(id);

    if (!helpRequest) {
      res.status(404).json({ message: 'Help request not found' });
      return;
    }

    // Only helper or requester can resolve the request
    const isRequester = helpRequest.requester.toString() === req.user.id;
    const isHelper = helpRequest.helper && helpRequest.helper.toString() === req.user.id;

    if (!isRequester && !isHelper) {
      res.status(403).json({ message: 'Not authorized to resolve this request' });
      return;
    }

    helpRequest.status = 'resolved';
    await helpRequest.save();

    res.json({
      message: 'Help request marked as resolved',
      helpRequest,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 5. Cancel Help Request
export const cancelHelpRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const helpRequest = await HelpRequest.findById(id);

    if (!helpRequest) {
      res.status(404).json({ message: 'Help request not found' });
      return;
    }

    // Only requester can cancel their request
    if (helpRequest.requester.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized to cancel this request' });
      return;
    }

    helpRequest.status = 'cancelled';
    await helpRequest.save();

    res.json({
      message: 'Help request cancelled successfully',
      helpRequest,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 6. Get My Requests (Requests I created)
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await HelpRequest.find({ requester: req.user.id })
      .sort({ createdAt: -1 })
      .populate('helper', 'name email contactNumber location orgType');
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 7. Get My Assignments (Requests I accepted)
export const getMyAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignments = await HelpRequest.find({ helper: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('requester', 'name email contactNumber location');
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 8. Get All Pending Help Requests (regardless of capability, sorted by recency)
export const getAllPendingHelpRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await HelpRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('requester', 'name email contactNumber location');
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

