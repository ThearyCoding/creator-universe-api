import { User } from "@/user/models/user.model";
import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    _id: string;
    role: string;
    [key: string]: any; // Allow other properties
  };
}

export const checkRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Check if user ID exists
      if (!req.userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // 2. Find user in database
      const user = await User.findById(req.userId).select('role').lean();
      
      if (!user) {
        res.status(403).json({ 
          message: `Access denied. User not found`
        });
        return;
      }

      // 3. Verify role
      if (!roles.includes(user.role)) {
        res.status(403).json({ 
          message: `Access denied. Requires roles: ${roles.join(', ')}`
        });
        return;
      }

      // 4. Attach minimal user data to request
      req.user = {
        _id: user._id.toString(),
        role: user.role
      };
      
      next();
    } catch (err: unknown) {
      console.error('Role check error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  };
};