import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path'; // Add this import
import { errorHandler, notFound } from './middlewares/error.middleware';
import categoryRoutes from "./category/routes/category.routes";
import bannerRoutes from "./banner/routes/banner.routes";
import authRoutes from './auth/routes/auth.routes';
import userRoutes from './user/routes/user.routes';
import productRoutes from "./product/routes/product.routes";
import uploadRoutes from "./upload/routes/upload.routes";
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

// ✅ Simple CORS configuration that allows all origins for development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
}));

// ✅ Handle preflight requests
app.options('*', cors());

// ✅ Helmet configuration (allow images from your domain)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "*"], // Allow images from anywhere
      connectSrc: ["'self'", "*"] // Allow API connections
    },
  },
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' })); // Increase limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve static files (IMPORTANT: Add this for image serving)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger setup
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// Root endpoint with CORS info
app.get('/', (req, res) => {
  res.json({
    name: 'Creator Universe API',
    version: '1.0.1-corsfix',
    status: 'OK',
    uptime: process.uptime().toFixed(2) + 's',
    environment: process.env.NODE_ENV || 'development',
    docs: `${req.protocol}://${req.get('host')}/api-docs`,
    cors: 'enabled',
    staticFiles: '/uploads for image serving'
  });
});

// ========================
// Routes
// ========================
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/uploads", uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ✅ Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// ========================
// Error Handling
// ========================
app.use(notFound);
app.use(errorHandler);

// ========================
// Server Startup
// ========================

const PORT = process.env.PORT || 5050;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`CORS enabled for development origins`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Database connection
connectDB();

export default app;