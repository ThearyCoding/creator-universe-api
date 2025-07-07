"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
const user_model_1 = require("@/user/models/user.model");
const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            // 1. Check if user ID exists
            if (!req.userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            // 2. Find user in database
            const user = await user_model_1.User.findById(req.userId).select('role').lean();
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
        }
        catch (err) {
            console.error('Role check error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            res.status(500).json({
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            });
        }
    };
};
exports.checkRole = checkRole;
