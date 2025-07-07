import rateLimit from "express-rate-limit";

// In your rateLimit middleware:
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: "Too many OTP requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});