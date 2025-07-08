import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middlewares/error.middleware';
import authRoutes from './auth/routes/auth.routes';
import { apiLimiter } from './middlewares/rateLimit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './docs/swagger.config';
// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ========================
// Database Connection
// ========================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

// ========================
// Middleware
// ========================
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/', (req, res) => {
  res.json({
    name: 'Creator Universe API',
    version: '1.0.0',
    status: 'OK',
    uptime: process.uptime().toFixed(2) + 's',
    environment: process.env.NODE_ENV || 'development',
    docs: `${req.protocol}://${req.get('host')}/api-docs`
  });
});

// ========================
// Routes
// ========================
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// ========================
// Error Handling
// ========================
app.use(notFound);
app.use(errorHandler);

// ========================
// Server Startup
// ========================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Database connection
connectDB();

export default app;