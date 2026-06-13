import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';
import authRoutes from './routes/authRoutes';
import { swaggerSpec } from './swagger';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sanjivani_sync');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API is running...');
});

// API Documentation (Scalar)
app.use(
  '/docs',
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: 'purple',
  })
);

app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/docs`);
});
