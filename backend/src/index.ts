import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import helpRequestRoutes from './routes/helpRequestRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import { swaggerSpec } from './swagger';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins and reflect the requesting origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.options('*', cors()); // Explicitly handle preflight for all routes
app.use(express.json());

// Serverless database connection caching
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sanjivani_sync');
    isConnected = db.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${db.connection.host}`);
  } catch (error: any) {
    console.error(`MongoDB Connection Error: ${error.message}`);
  }
};

// Apply connection middleware to ensure DB is connected before handling requests in serverless
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Serve the OpenAPI specification
app.get('/openapi.json', (req, res) => {
  res.json(swaggerSpec);
});

// API Documentation (Scalar) - Using CDN
app.get('/docs', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sanjivani Sync API Reference</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>body { margin: 0; padding: 0; }</style>
      </head>
      <body>
        <script id="api-reference" data-url="/openapi.json"></script>
        <script>
          var configuration = {
            theme: 'purple'
          };
          document.getElementById('api-reference').dataset.configuration = JSON.stringify(configuration);
        </script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `;
  res.send(html);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/docs`);
  });
}

export default app;
