import { Request, Response } from 'express';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const toggleOnlineStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isOnline, location, helpTypes } = req.body;

    if (typeof isOnline !== 'boolean') {
      res.status(400).json({ message: 'isOnline field must be a boolean' });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.isOnline = isOnline;

    if (location) {
      user.location = {
        address: location.address || user.location.address,
        coordinates: {
          type: 'Point',
          coordinates: location.coordinates || user.location.coordinates.coordinates,
        },
      };
    }

    if (helpTypes) {
      user.helpTypes = helpTypes;
    }

    const updatedUser = await user.save();

    res.json({
      message: `User status set to ${isOnline ? 'Online' : 'Offline'}`,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        orgType: updatedUser.orgType,
        isOnline: updatedUser.isOnline,
        location: updatedUser.location,
        helpTypes: updatedUser.helpTypes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
