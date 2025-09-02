"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const authorizeRoles_1 = require("../../middlewares/authorizeRoles");
const banner_controller_1 = require("../controllers/banner.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
const controller = new banner_controller_1.BannerController();
/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Promotional banners management
 *
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "66d0a0f9f2cba4f9c2b2e111" }
 *         title: { type: string, example: "Summer Sale" }
 *         subtitle: { type: string, example: "Up to 50% off" }
 *         description: { type: string, example: "Limited time offers on selected items." }
 *         imageUrl: { type: string, format: uri, example: "https://cdn.example.com/banners/summer.jpg" }
 *         linkUrl: { type: string, format: uri, example: "https://example.com/sale" }
 *         position: { type: integer, example: 1 }
 *         isActive: { type: boolean, example: true }
 *         startDate: { type: string, format: date-time, example: "2025-06-01T00:00:00.000Z" }
 *         endDate: { type: string, format: date-time, example: "2025-06-30T23:59:59.000Z" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     BannerCreate:
 *       type: object
 *       required: [title, imageUrl]
 *       properties:
 *         title: { type: string, example: "Summer Sale" }
 *         subtitle: { type: string, example: "Up to 50% off" }
 *         description: { type: string, example: "Limited time offers on selected items." }
 *         imageUrl: { type: string, format: uri, example: "https://cdn.example.com/banners/summer.jpg" }
 *         linkUrl: { type: string, format: uri, example: "https://example.com/sale" }
 *         position: { type: integer, example: 1 }
 *         isActive: { type: boolean, example: true }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *     BannerUpdate:
 *       type: object
 *       properties:
 *         title: { type: string }
 *         subtitle: { type: string }
 *         description: { type: string }
 *         imageUrl: { type: string, format: uri }
 *         linkUrl: { type: string, format: uri }
 *         position: { type: integer }
 *         isActive: { type: boolean }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *     PaginatedBanners:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Banner'
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 10 }
 *         total: { type: integer, example: 12 }
 *         pages: { type: integer, example: 2 }
 */
/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create a banner (admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerCreate'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.create(req, res);
}));
/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: List banners (public)
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "sale" }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean, example: true }
 *       - in: query
 *         name: nowOnly
 *         schema: { type: boolean, example: true }
 *         description: If true, returns only banners active right now (isActive=true and within start/end dates)
 *     responses:
 *       200:
 *         description: Paginated banners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedBanners'
 */
router.get("/", (0, asyncHandler_1.asyncHandler)(controller.list));
/**
 * @swagger
 * /api/banners/{id}:
 *   get:
 *     summary: Get a banner by id (public)
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Banner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Not found
 */
router.get("/:id", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.getOne(req, res);
}));
/**
 * @swagger
 * /api/banners/{id}:
 *   patch:
 *     summary: Update a banner (admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerUpdate'
 *     responses:
 *       200:
 *         description: Updated banner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch("/:id", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.update(req, res);
}));
/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Delete a banner (admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete("/:id", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.remove(req, res);
}));
exports.default = router;
