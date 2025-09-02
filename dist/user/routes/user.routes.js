"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account endpoints
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id: { type: string, example: "665f1a0b9d8c2e0012abcd34" }
 *         name: { type: string, example: "Jane Doe" }
 *         email: { type: string, format: email, example: "jane@example.com" }
 *         phone: { type: string, nullable: true, example: "+1 555 123 4567" }
 *         isVerified: { type: boolean, example: true }
 *         role: { type: string, enum: ["user", "admin"], example: "user" }
 *         googleId: { type: boolean, example: true }
 *         facebookId: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     DeleteAccountRequest:
 *       type: object
 *       oneOf:
 *         - required: [currentPassword]
 *           properties:
 *             currentPassword:
 *               type: string
 *               example: "My$trongP@ssw0rd"
 *         - required: [confirm]
 *           properties:
 *             confirm:
 *               type: boolean
 *               example: true
 *       description: >
 *         For password accounts send `currentPassword`. For social-only accounts (no password set) send `confirm: true`.
 *     ApiMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Account deleted successfully"
 *     ApiError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User not found"
 */
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/me", auth_1.authenticate, (req, res, next) => {
    userController.getProfile(req, res).catch(next);
});
/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Delete current user's account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteAccountRequest'
 *     responses:
 *       200:
 *         description: Account deletion confirmation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiMessage'
 *       400:
 *         description: Bad request (missing confirmation or currentPassword)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized or invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.delete("/me", auth_1.authenticate, (req, res, next) => {
    userController.deleteAccount(req, res).catch(next);
});
exports.default = router;
