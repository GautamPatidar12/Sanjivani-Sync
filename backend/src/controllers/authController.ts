import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, orgType, contactNumber, location, helpTypes } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      orgType: role === 'organization' ? (orgType || 'hospital') : 'none',
      contactNumber,
      location: {
        address: location?.address || 'Unknown Address',
        coordinates: {
          type: 'Point',
          coordinates: location?.coordinates || [77.5946, 12.9716], // default Bengaluru coordinates
        },
      },
      helpTypes: helpTypes || [],
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgType: user.orgType,
      location: user.location,
      helpTypes: user.helpTypes,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role, orgType, name, location, helpTypes, contactNumber } = req.body;

    // Determine target email for dummy login
    let targetEmail = email;
    const targetRole = role || 'helper';
    const targetOrgType = targetRole === 'organization' ? (orgType || 'hospital') : 'none';

    if (!targetEmail) {
      if (targetRole === 'organization') {
        targetEmail = `dummy_${targetOrgType}@sanjivani.com`;
      } else {
        targetEmail = `dummy_${targetRole}@sanjivani.com`;
      }
    }
    targetEmail = targetEmail.toLowerCase();

    // Check if user exists
    let user = await User.findOne({ email: targetEmail });

    if (!user) {
      // Create a dummy user dynamically if they don't exist
      const salt = await bcrypt.genSalt(10);
      const dummyPassword = await bcrypt.hash('dummy123', salt);

      // Default coordinates centered around Bengaluru
      let defaultCoords: [number, number] = [77.5946, 12.9716];
      if (targetRole === 'organization') {
        // Offset coordinates slightly to show distance separation
        if (targetOrgType === 'hospital') defaultCoords = [77.5996, 12.9766];
        else if (targetOrgType === 'blood_bank') defaultCoords = [77.5896, 12.9666];
        else if (targetOrgType === 'hotel') defaultCoords = [77.6046, 12.9816];
        else if (targetOrgType === 'vehicle_owner') defaultCoords = [77.5846, 12.9616];
      }

      // Default help types
      let defaultHelpTypes = helpTypes || [];
      if (!helpTypes || helpTypes.length === 0) {
        if (targetRole === 'organization') {
          if (targetOrgType === 'hospital' || targetOrgType === 'blood_bank') {
            defaultHelpTypes = ['blood'];
          } else if (targetOrgType === 'hotel') {
            defaultHelpTypes = ['shelter', 'food'];
          } else if (targetOrgType === 'vehicle_owner') {
            defaultHelpTypes = ['transport'];
          }
        } else if (targetRole === 'helper') {
          defaultHelpTypes = ['blood', 'food', 'shelter', 'transport'];
        }
      }

      // Build name
      let defaultName = name;
      if (!defaultName) {
        if (targetRole === 'organization') {
          defaultName = `Dummy ${targetOrgType.charAt(0).toUpperCase() + targetOrgType.slice(1).replace('_', ' ')}`;
        } else {
          defaultName = `Dummy ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}`;
        }
      }

      user = await User.create({
        name: defaultName,
        email: targetEmail,
        password: dummyPassword,
        role: targetRole,
        orgType: targetOrgType,
        contactNumber: contactNumber || '9999999999',
        location: {
          address: location?.address || '123 Emergency St, Bengaluru',
          coordinates: {
            type: 'Point',
            coordinates: location?.coordinates || defaultCoords,
          },
        },
        helpTypes: defaultHelpTypes,
        isOnline: targetRole !== 'requester', // default helpers to online
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgType: user.orgType,
      isOnline: user.isOnline,
      helpTypes: user.helpTypes,
      location: user.location,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.contactNumber = req.body.contactNumber || user.contactNumber;
      
      if (req.body.location) {
        user.location = {
          address: req.body.location.address || user.location.address,
          coordinates: {
            type: 'Point',
            coordinates: req.body.location.coordinates || user.location.coordinates.coordinates,
          },
        };
      }

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        orgType: updatedUser.orgType,
        isOnline: updatedUser.isOnline,
        location: updatedUser.location,
        helpTypes: updatedUser.helpTypes,
        token: generateToken(updatedUser._id.toString()),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
