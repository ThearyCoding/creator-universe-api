"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_routes_1 = __importDefault(require("./auth/routes/auth.routes"));
const rateLimit_1 = require("./middlewares/rateLimit");
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = __importDefault(require("./docs/swagger.config"));
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
// ========================
// Database Connection
// ========================
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    }
    catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};
// ========================
// Middleware
// ========================
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const swaggerSpec = (0, swagger_jsdoc_1.default)(swagger_config_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
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
app.use('/api', rateLimit_1.apiLimiter);
app.use('/api/auth', auth_routes_1.default);
// app.use('/api/users', userRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});
// ========================
// Error Handling
// ========================
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
// ========================
// Server Startup
// ========================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
});
// Database connection
connectDB();
exports.default = app;
