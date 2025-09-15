import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middlewares/error.middleware';
import categoryRoutes from "./category/routes/category.routes";
import bannerRoutes from "./banner/routes/banner.routes";
import authRoutes from './auth/routes/auth.routes';
import userRoutes from './user/routes/user.routes';
import mobileProductsRouter from "./product/routes/mobile.products.routes";
import adminProductsRouter from "./product/routes/admin.products.routes"
import attributeRoutes  from "./attribute/routes/admin.attribute.routes";
import uploadRoutes from "./upload/routes/upload.routes";
import { apiLimiter } from './middlewares/rateLimit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './docs/swagger.config';
// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.set('trust proxy', 1);


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
  origin: '*', 

  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/', (req, res) => {
  res.json({
    name: 'Creator Universe API',
    version: '1.0.1-corsfix',
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
app.use('/api/users', userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/mobile/products", mobileProductsRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/uploads", uploadRoutes);
app.use("/api/attributes",attributeRoutes);

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

const PORT = process.env.PORT || 5050;
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

