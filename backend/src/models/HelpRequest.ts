import mongoose, { Document, Schema } from 'mongoose';

export interface IHelpRequest extends Document {
  requester: mongoose.Types.ObjectId;
  helpType: 'blood' | 'shelter' | 'food' | 'transport';
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: {
    address: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  status: 'pending' | 'accepted' | 'resolved' | 'cancelled';
  helper?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const helpRequestSchema: Schema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    helpType: {
      type: String,
      enum: ['blood', 'shelter', 'food', 'transport'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
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
          required: true,
        },
      },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'resolved', 'cancelled'],
      default: 'pending',
    },
    helper: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
helpRequestSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model<IHelpRequest>('HelpRequest', helpRequestSchema);
