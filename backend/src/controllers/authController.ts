import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User, { IUser } from '../models/User';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const targetEmail = email.toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: targetEmail }).select('+password');

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.password) {
      res.status(401).json({ message: 'Invalid credentials. Please use Google Login if you signed up with Google.' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Determine default helpTypes and coordinates to ensure no undefined crashes on frontend
    const defaultCoords: [number, number] = [77.5946, 12.9716];

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgType: user.orgType,
      isOnline: user.isOnline,
      helpTypes: user.helpTypes || [],
      location: user.location || { address: 'Unknown', coordinates: { type: 'Point', coordinates: defaultCoords } },
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body; // Actually this will now be the access_token
    
    if (!credential) {
      res.status(400).json({ message: 'Missing Google credential token' });
      return;
    }

    // Verify access token by fetching user profile from Google
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` }
    });

    if (!googleResponse.ok) {
      res.status(400).json({ message: 'Invalid Google access token' });
      return;
    }

    const payload = await googleResponse.json();

    if (!payload || !payload.email) {
      res.status(400).json({ message: 'Invalid Google token payload' });
      return;
    }

    const targetEmail = payload.email.toLowerCase();
    let user = await User.findOne({ email: targetEmail });

    if (!user) {
      // Create user if not exists
      const salt = await bcrypt.genSalt(10);
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt);

      user = await User.create({
        name: payload.name || 'Google User',
        email: targetEmail,
        password: randomPassword,
        role: 'requester', // default role
        orgType: 'none',
        contactNumber: '0000000000', // default fallback
        location: {
          address: 'Unknown Address',
          coordinates: {
            type: 'Point',
            coordinates: [77.5946, 12.9716],
          },
        },
        helpTypes: [],
      });
    }

    const defaultCoords: [number, number] = [77.5946, 12.9716];

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgType: user.orgType,
      isOnline: user.isOnline,
      helpTypes: user.helpTypes || [],
      location: user.location || { address: 'Unknown', coordinates: { type: 'Point', coordinates: defaultCoords } },
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
