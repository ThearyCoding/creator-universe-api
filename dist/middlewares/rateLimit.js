"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.otpRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// In your rateLimit middleware:
exports.otpRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: "Too many OTP requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false
});
// Rate limiting for API routes
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later'
});
