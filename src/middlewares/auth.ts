import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import {User} from "../user/models/user.model";
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

export const authenticate: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.get("authorization");
    const token = auth?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return; // IMPORTANT: don't "return res.json(...)" (would return Response)
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      res.status(401).json({ message: "Token expired" });
      return;
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    console.error("Authentication error:", err);
    res.status(500).json({ message: "Authentication failed" });
  }
};
/**
 * Optional authentication: if token exists, validate and attach userId.
 * If no token, just continue without error.
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        // Don't block request, just don't attach userId
        console.warn("Optional auth: token expired");
      } else {
        req.userId = decoded.id;
      }
    }

    next();
  } catch (err) {
    // Ignore errors silently since auth is optional
    console.warn("Optional auth failed:", err);
    next();
  }
};


export function authorizeRoles(...roles: Array<"admin" | "user">) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findById(req.userId).select("role");
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" }); 
      }

      if (!roles.includes(user.role as any)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }

     return next();
    } catch (err) {
      console.error("authorizeRoles error:", err);
    return  res.status(500).json({ message: "Authorization check failed" });
    }
  };
}