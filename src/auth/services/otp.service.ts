import { User } from "../../user/models/user.model";

// Generate 4-digit OTP
export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Store OTP in database
export const storeOTP = async (phone: string, otp: string): Promise<void> => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10'));

  await User.findOneAndUpdate(
    { phone },
    { 
      otp,
      otpExpiry: expiry,
      $inc: { otpAttempts: 1 } 
    },
    { upsert: true, new: true }
  );
};

// Verify OTP
export const verifyOTP = async (phone: string, otp: string): Promise<{ valid: boolean; user?: any }> => {
  const user = await User.findOne({ 
    phone,
    otp,
    otpExpiry: { $gt: new Date() } 
  });

  if (!user) {
    return { valid: false };
  }

  // Clear OTP after successful verification
  await User.findByIdAndUpdate(user._id, {
    $unset: { otp: "", otpExpiry: "" },
    isVerified: true 
  });

  return { valid: true, user };
};
