import axios from 'axios';
import { generateOTP } from './otp.service';

interface PlasgateResponse {
  status: number;
  message_id?: string;
  error?: string;
}

export const sendSMS = async (
  phone: string,
  message: string
): Promise<PlasgateResponse> => {
  try {
    const response = await axios.post(
      `${process.env.PLASGATE_API_URL}?private_key=${process.env.PLASGATE_PRIVATE_KEY}`,
      {
        sender: process.env.PLASGATE_SENDER_ID,
        to: phone,
        content: message
      },
      {
        headers: {
          'X-Secret': process.env.PLASGATE_X_SECRET,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    return {
      status: response.status,
      message_id: response.data.message_id
    };
  } catch (error: any) {
    console.error('Plasgate API Error:', error.response?.data || error.message);
    return {
      status: error.response?.status || 500,
      error: error.response?.data?.error || 'SMS service unavailable'
    };
  }
};



export const sendOTP = async (phone: string): Promise<{ otp: string; success: boolean }> => {
  const otp = generateOTP();
  const otpTemplate = process.env.PLASGATE_OTP_TEMPLATE || 'Your OTP is {OTP}. It is valid for {MINUTES} minutes.';
  
  const message = otpTemplate
    .replace('{OTP}', otp)
    .replace('{MINUTES}', process.env.OTP_EXPIRY_MINUTES || '10');

  const result = await sendSMS(phone, message);

  return {
    otp,
    success: result.status === 200,
  };
};
