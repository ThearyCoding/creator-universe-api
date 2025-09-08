"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.storeOTP = exports.generateOTP = void 0;
const user_model_1 = require("../../user/models/user.model");
// Generate 4-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
exports.generateOTP = generateOTP;
// Store OTP in database
const storeOTP = async (phone, otp) => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10'));
    await user_model_1.User.findOneAndUpdate({ phone }, {
        otp,
        otpExpiry: expiry,
        $inc: { otpAttempts: 1 }
    }, { upsert: true, new: true });
};
exports.storeOTP = storeOTP;
// Verify OTP
const verifyOTP = async (phone, otp) => {
    const user = await user_model_1.User.findOne({
        phone,
        otp,
        otpExpiry: { $gt: new Date() }
    });
    if (!user) {
        return { valid: false };
    }
    // Clear OTP after successful verification
    await user_model_1.User.findByIdAndUpdate(user._id, {
        $unset: { otp: "", otpExpiry: "" },
        isVerified: true
    });
    return { valid: true, user };
};
exports.verifyOTP = verifyOTP;
