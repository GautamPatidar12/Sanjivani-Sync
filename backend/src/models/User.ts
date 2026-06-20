import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because we might not send it to client
  role: 'helper' | 'requester' | 'organization';
  orgType: 'hospital' | 'blood_bank' | 'hotel' | 'vehicle_owner' | 'none';
  contactNumber: string;
  location: {
    address: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  isOnline: boolean;
  helpTypes: ('blood' | 'shelter' | 'food' | 'transport' | 'volunteer' | 'medicine')[];
  pushSubscriptions?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }[];
  emergencyContacts?: {
    name: string;
    relation: string;
    phone: string;
    selected: boolean;
    avatar?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['helper', 'requester', 'organization'],
      required: true,
    },
    orgType: {
      type: String,
      enum: ['hospital', 'blood_bank', 'hotel', 'vehicle_owner', 'none'],
      default: 'none',
    },
    contactNumber: {
      type: String,
      required: true,
    },
    location: {
      address: {
        type: String,
        required: true,
        default: 'Unknown Address',
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0], // default coordinates
        },
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    helpTypes: {
      type: [String],
      enum: ['blood', 'shelter', 'food', 'transport', 'volunteer', 'medicine'],
      default: [],
    },
    pushSubscriptions: {
      type: [{
        endpoint: String,
        keys: {
          p256dh: String,
          auth: String,
        },
      }],
      default: [],
    },
    emergencyContacts: {
      type: [{
        name: String,
        relation: String,
        phone: String,
        selected: { type: Boolean, default: true },
        avatar: { type: String, default: '' },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model<IUser>('User', userSchema);
