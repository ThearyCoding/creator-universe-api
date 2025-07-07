"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFacebookToken = void 0;
const axios_1 = __importDefault(require("axios"));
const verifyFacebookToken = async (accessToken) => {
    try {
        const fields = "id,name,email";
        const response = await axios_1.default.get(`https://graph.facebook.com/me?fields=${fields}&access_token=${accessToken}`);
        const data = response.data;
        return {
            id: data.id,
            name: data.name,
            email: data.email,
        };
    }
    catch (error) {
        console.error("Facebook token verification failed:", error.response?.data || error.message);
        return null;
    }
};
exports.verifyFacebookToken = verifyFacebookToken;
