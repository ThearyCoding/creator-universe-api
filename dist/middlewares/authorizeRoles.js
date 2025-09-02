"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = authorizeRoles;
// src/middlewares/authorizeRoles.ts
const user_model_1 = require("../user/models/user.model");
function authorizeRoles(...roles) {
    return async (req, res, next) => {
        try {
            if (!req.userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            const user = await user_model_1.User.findById(req.userId).select("role");
            if (!user) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            if (!roles.includes(user.role)) {
                res.status(403).json({ message: "Forbidden: insufficient role" });
                return;
            }
            next();
        }
        catch (err) {
            console.error("authorizeRoles error:", err);
            res.status(500).json({ message: "Authorization check failed" });
        }
    };
}
