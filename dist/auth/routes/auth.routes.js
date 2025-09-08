"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimit_1 = require("../../middlewares/rateLimit");
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */
const router = express_1.default.Router();
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists
 */
router.post("/register", auth_controller_1.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", auth_controller_1.login);
/**
 * @swagger
 * /api/auth/otp/request:
 *   post:
 *     summary: Request OTP for phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Invalid phone number
 *       502:
 *         description: Failed to send OTP
 */
router.post("/otp/request", rateLimit_1.otpRateLimiter, auth_controller_1.requestOTP);
/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     summary: Verify received OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified, token returned
 *       401:
 *         description: Invalid OTP
 */
router.post("/otp/verify", auth_controller_1.confirmOTP);
/**
 * @swagger
 * /api/auth/oauth/{provider}:
 *   post:
 *     summary: Handle OAuth login (Google, Facebook)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth provider (google or facebook)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: OAuth access token from client
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       400:
 *         description: Unsupported provider or missing token
 *       401:
 *         description: Invalid token or verification failed
 *       500:
 *         description: Server error
 */
router.post("/oauth/:provider", auth_controller_1.oauthCallback);
exports.default = router;
