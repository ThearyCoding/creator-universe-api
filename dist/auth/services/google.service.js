"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = void 0;
const google_auth_library_1 = require("google-auth-library");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyGoogleToken = async (idToken) => {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload)
            return null;
        return {
            sub: payload.sub,
            email: payload.email || '',
            name: payload.name || '',
            picture: payload.picture,
            email_verified: payload.email_verified || false,
        };
    }
    catch (error) {
        console.error('Google token verification error:', error);
        return null;
    }
};
exports.verifyGoogleToken = verifyGoogleToken;
