"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/category/routes/category.routes.ts
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const authorizeRoles_1 = require("../../middlewares/authorizeRoles");
const category_controller_1 = require("../controllers/category.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
const controller = new category_controller_1.CategoryController();
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 *
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "66cfe0e27a51a6b9c4b27e0a" }
 *         name: { type: string, example: "Web Development" }
 *         description: { type: string, example: "All web dev tutorials" }
 *         slug: { type: string, example: "web-development" }
 *         imageUrl: { type: string, format: uri, example: "https://cdn.example.com/img/web-dev.png" }
 *         isActive: { type: boolean, example: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CategoryCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "Web Development" }
 *         description: { type: string, example: "All web dev tutorials" }
 *         imageUrl: { type: string, format: uri, example: "https://cdn.example.com/img/web-dev.png" }
 *         isActive: { type: boolean, example: true }
 *     CategoryUpdate:
 *       type: object
 *       properties:
 *         name: { type: string, example: "Frontend Development" }
 *         description: { type: string, example: "Frontend-focused content" }
 *         imageUrl: { type: string, format: uri, example: "https://cdn.example.com/img/frontend.png" }
 *         isActive: { type: boolean, example: true }
 *         slug: { type: string, example: "frontend-development" }
 *     PaginatedCategories:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 10 }
 *         total: { type: integer, example: 27 }
 *         pages: { type: integer, example: 3 }
 */
/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreate'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Duplicate name or slug
 */
router.post("/", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.create(req, res);
}));
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List categories (public)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "web" }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Paginated categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedCategories'
 */
router.get("/", (0, asyncHandler_1.asyncHandler)(controller.list));
/**
 * @swagger
 * /api/categories/{idOrSlug}:
 *   get:
 *     summary: Get a category by id or slug (public)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Not found
 */
router.get("/:idOrSlug", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.getOne(req, res);
}));
/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/CategoryUpdate'
 *     responses:
 *       200:
 *         description: Updated category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       409:
 *         description: Duplicate name or slug
 */
router.put("/:id", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.update(req, res);
}));
/**
 * @swagger
 * /api/categories/bulk-delete:
 *   post:
 *     summary: Bulk delete categories (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/bulk-delete", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.removeBulk(req, res);
}));
router.post("/status", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.updateStatus(req, res); // <-- never reached
}));
exports.default = router;
