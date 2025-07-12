import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../../user/models/user.model";
import { storeOTP, verifyOTP } from "../services/otp.service";
import { sendOTP } from "../services/plasgate.service";
import {
  GoogleUserPayload,
  verifyGoogleToken,
} from "../services/google.service";
import {
  FacebookUserData,
  verifyFacebookToken,
} from "../services/facebook.service";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function for generating tokens
const generateAuthToken = (user: any): string => {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
};

// Register with Email & Password
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    user = new User({ name, email, password, phone });
    await user.save();

    const token = generateAuthToken(user);
    res.status(201).json({ token, user });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Server Error", error });
  }
};

// Login with Email & Password
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Server Error", error });
  }
};

// Request OTP
export const requestOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { phone } = req.body;

  try {
    if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      res.status(400).json({ error: "Invalid phone number format" });
      return;
    }

    const { otp, success } = await sendOTP(phone);

    if (!success) {
      res.status(502).json({ error: "Failed to send OTP" });
      return;
    }

    await storeOTP(phone, otp);

    res.json({
      success: true,
      expires_in: `${process.env.OTP_EXPIRY_MINUTES || 10} minutes`,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      error: "OTP processing failed",
      details: error,
    });
  }
};

// Confirm OTP
export const confirmOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { phone, otp } = req.body;

  try {
    const { valid, user } = await verifyOTP(phone, otp);

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
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      error: "OTP verification failed",
      details: error,
    });
  }
};
export const oauthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token } = req.body;

  const {provider} = req.params;


  console.log("OAuth provider:", provider);

  try {
    let userData;
    if (provider === "google") {
      userData = await verifyGoogleToken(token);
      if (!userData || !userData.email_verified) {
        res.status(401).json({ message: "Invalid or unverified Google token" });
        return;
      }
    } else if (provider === "facebook") {
      userData = await verifyFacebookToken(token);
      if (!userData) {
        res.status(401).json({ message: "Invalid Facebook token" });
        return;
      }
    } else {
      res.status(400).json({ message: "Unsupported OAuth provider" });
      return;
    }

    const userId =
      provider === "google"
        ? (userData as GoogleUserPayload).sub
        : (userData as FacebookUserData).id;
    const userIdField = provider === "google" ? "googleId" : "facebookId";

    let user = await User.findOne({ [userIdField]: userId });
    if (!user) {
      user = new User({
        name: userData.name,
        email: userData.email,
        [userIdField]: userId,
        isVerified: true,
      });
      await user.save();
    }

    const authToken = generateAuthToken(user);
    res.json({ token: authToken, user });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Server Error", error });
  }
};
