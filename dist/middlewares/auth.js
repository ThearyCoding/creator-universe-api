"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const authenticate = async (req, res, next) => {
    try {
        // 1. Get token from header
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            res.status(401).json({ message: "No token provided" });
            return;
        }
        // 2. Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // 3. Check token expiration (handled automatically by verify, but explicit check is good)
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            res.status(401).json({ message: "Token expired" });
            return;
        }
        // 4. Attach user ID to request
        req.userId = decoded.id;
        // 5. Continue to next middleware
        next();
    }
    catch (err) {
        // Handle specific JWT errors
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: "Token expired" });
        }
        else if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ message: "Invalid token" });
        }
        else {
            console.error("Authentication error:", err);
            res.status(500).json({ message: "Authentication failed" });
        }
    }
};
exports.authenticate = authenticate;
