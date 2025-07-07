import express from "express";
import {
  confirmOTP,
  login,
  oauthCallback,
  register,
  requestOTP,
} from "../controllers/auth.controller";
import { otpRateLimiter } from "../../middlewares/rateLimit";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

const router = express.Router();

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
router.post("/register", register);

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
router.post("/login", login);

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
router.post("/otp/request", otpRateLimiter, requestOTP);

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
router.post("/otp/verify", confirmOTP);

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
router.post("/oauth/:provider", oauthCallback);

export default router;
