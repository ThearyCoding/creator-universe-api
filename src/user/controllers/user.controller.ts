import { Request, Response } from "express";
import { User } from "../models/user.model";

export class UserController {
    constructor() { }
    /**
     * GET /api/users/me
     * Returns current user's profile (safe fields only)
     */
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.userId!;
            const user = await User.findById(userId).select("-password -otp -otpExpiry");

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            return res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                role: user.role,
                googleId: !!user.googleId,
                facebookId: !!user.facebookId,
            });
        } catch (err) {
            console.error("getProfile error:", err);
            return res.status(500).json({ message: "Failed to fetch profile" });
        }
    };

    /**
     * DELETE /api/users/me
     * Deletes current user's account.
     * - If password account, require currentPassword.
     * - If social-only account, require confirm=true.
     */
    async deleteAccount(req: Request, res: Response) {
        try {
            const userId = req.userId!;
            const { currentPassword, confirm } = req.body as {
                currentPassword?: string;
                confirm?: boolean;
            };

            const user = await User.findById(userId).select("+password");
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const hasPassword = !!user.password;

            if (hasPassword) {
                if (!currentPassword) {
                    return res
                        .status(400)
                        .json({ message: "currentPassword is required to delete account" });
                }
                const ok = await user.comparePassword(currentPassword);
                if (!ok) {
                    return res.status(401).json({ message: "Invalid current password" });
                }
            } else {
                if (!confirm) {
                    return res.status(400).json({
                        message:
                            "Set confirm=true in the request body to delete a social-login account",
                    });
                }
            }

            await User.deleteOne({ _id: user._id });
            return res.json({ message: "Account deleted successfully" });
        } catch (err) {
            console.error("deleteAccount error:", err);
            return res.status(500).json({ message: "Failed to delete account" });
        }
    };
}
