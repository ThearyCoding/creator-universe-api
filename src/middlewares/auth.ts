import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface DecodedToken {
  id: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    
    // 3. Check token expiration (handled automatically by verify, but explicit check is good)
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      res.status(401).json({ message: "Token expired" });
      return;
    }

    // 4. Attach user ID to request
    req.userId = decoded.id;
    
    // 5. Continue to next middleware
    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
    } else {
      console.error("Authentication error:", err);
      res.status(500).json({ message: "Authentication failed" });
    }
  }
};