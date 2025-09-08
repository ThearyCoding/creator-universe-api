"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = exports.sendSMS = void 0;
const axios_1 = __importDefault(require("axios"));
const otp_service_1 = require("./otp.service");
const sendSMS = async (phone, message) => {
    try {
        const response = await axios_1.default.post(`${process.env.PLASGATE_API_URL}?private_key=${process.env.PLASGATE_PRIVATE_KEY}`, {
            sender: process.env.PLASGATE_SENDER_ID,
            to: phone,
            content: message
        }, {
            headers: {
                'X-Secret': process.env.PLASGATE_X_SECRET,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        return {
            status: response.status,
            message_id: response.data.message_id
        };
    }
    catch (error) {
        console.error('Plasgate API Error:', error.response?.data || error.message);
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.error || 'SMS service unavailable'
        };
    }
};
exports.sendSMS = sendSMS;
const sendOTP = async (phone) => {
    const otp = (0, otp_service_1.generateOTP)();
    const otpTemplate = process.env.PLASGATE_OTP_TEMPLATE || 'Your OTP is {OTP}. It is valid for {MINUTES} minutes.';
    const message = otpTemplate
        .replace('{OTP}', otp)
        .replace('{MINUTES}', process.env.OTP_EXPIRY_MINUTES || '10');
    const result = await (0, exports.sendSMS)(phone, message);
    return {
        otp,
        success: result.status === 200,
    };
};
exports.sendOTP = sendOTP;
