"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthCallback = exports.confirmOTP = exports.requestOTP = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../../user/models/user.model");
const otp_service_1 = require("../services/otp.service");
const plasgate_service_1 = require("../services/plasgate.service");
const google_service_1 = require("../services/google.service");
const facebook_service_1 = require("../services/facebook.service");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// Helper function for generating tokens
const generateAuthToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
};
// Register with Email & Password
const register = async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        let user = await user_model_1.User.findOne({ email });
        if (user) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        user = new user_model_1.User({ name, email, password, phone });
        await user.save();
        const token = generateAuthToken(user);
        res.status(201).json({ token, user });
    }
    catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ message: "Server Error", error });
    }
};
exports.register = register;
// Login with Email & Password
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await user_model_1.User.findOne({ email }).select("+password");
        if (!user) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const token = generateAuthToken(user);
        res.json({ token, user });
    }
    catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ message: "Server Error", error });
    }
};
exports.login = login;
// Request OTP
const requestOTP = async (req, res) => {
    const { phone } = req.body;
    try {
        if (!/^\+?[0-9]{10,15}$/.test(phone)) {
            res.status(400).json({ error: "Invalid phone number format" });
            return;
        }
        const { otp, success } = await (0, plasgate_service_1.sendOTP)(phone);
        if (!success) {
            res.status(502).json({ error: "Failed to send OTP" });
            return;
        }
        await (0, otp_service_1.storeOTP)(phone, otp);
        res.json({
            success: true,
            expires_in: `${process.env.OTP_EXPIRY_MINUTES || 10} minutes`,
        });
    }
    catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({
            error: "OTP processing failed",
            details: error,
        });
    }
};
exports.requestOTP = requestOTP;
// Confirm OTP
const confirmOTP = async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const { valid, user } = await (0, otp_service_1.verifyOTP)(phone, otp);
        if (!valid || !user) {
            res.status(401).json({ error: "Invalid OTP" });
            return;
        }
        const token = generateAuthToken(user);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                phone: user.phone,
                isVerified: user.isPhoneVerified,
            },
        });
    }
    catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({
            error: "OTP verification failed",
            details: error,
        });
    }
};
exports.confirmOTP = confirmOTP;
const oauthCallback = async (req, res) => {
    const { token } = req.body;
    const { provider } = req.params;
    console.log("OAuth provider:", provider);
    try {
        let userData;
        if (provider === "google") {
            userData = await (0, google_service_1.verifyGoogleToken)(token);
            if (!userData || !userData.email_verified) {
                res.status(401).json({ message: "Invalid or unverified Google token" });
                return;
            }
        }
        else if (provider === "facebook") {
            userData = await (0, facebook_service_1.verifyFacebookToken)(token);
            if (!userData) {
                res.status(401).json({ message: "Invalid Facebook token" });
                return;
            }
        }
        else {
            res.status(400).json({ message: "Unsupported OAuth provider" });
            return;
        }
        const userId = provider === "google"
            ? userData.sub
            : userData.id;
        const userIdField = provider === "google" ? "googleId" : "facebookId";
        let user = await user_model_1.User.findOne({ [userIdField]: userId });
        if (!user) {
            user = new user_model_1.User({
                name: userData.name,
                email: userData.email,
                [userIdField]: userId,
                isVerified: true,
            });
            await user.save();
        }
        const authToken = generateAuthToken(user);
        res.json({ token: authToken, user });
    }
    catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ message: "Server Error", error });
    }
};
exports.oauthCallback = oauthCallback;
