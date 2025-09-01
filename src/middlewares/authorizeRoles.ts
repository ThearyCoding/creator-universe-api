// src/middlewares/authorizeRoles.ts
import { User } from "../user/models/user.model";
import { Request, Response, NextFunction, RequestHandler } from "express";

export function authorizeRoles(...roles: Array<"admin" | "user">): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await User.findById(req.userId).select("role");
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!roles.includes(user.role as any)) {
        res.status(403).json({ message: "Forbidden: insufficient role" });
        return;
      }

      next();
    } catch (err) {
      console.error("authorizeRoles error:", err);
      res.status(500).json({ message: "Authorization check failed" });
    }
  };
}
