// src/api/routes/admin.attribute.routes.ts
import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { asyncHandler } from "../../utils/asyncHandler";
import { AttributeController } from "../controllers/attribute.controller";

const router = Router();
const controller = new AttributeController();

// All endpoints require admin
router.use(authenticate, authorizeRoles("admin"));

/**
 * @swagger
 * tags:
 *   name: Attributes
 *   description: Admin-only management of product attributes and their values
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     AttributeValue:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "66e0b2a9c8d1a5e3f3c1a111" }
 *         label: { type: string, example: "Black" }
 *         value: { type: string, nullable: true, example: "#000000" }
 *         meta:
 *           type: object
 *           additionalProperties: true
 *           example: { swatch: "https://cdn.example.com/swatches/black.png" }
 *
 *     Attribute:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "66e0b0f9f2cba4f9c2b2e111" }
 *         name: { type: string, example: "Color" }
 *         code: { type: string, example: "color" }
 *         type:
 *           type: string
 *           enum: [text, color, size, number, select]
 *           example: color
 *         values:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttributeValue'
 *         isActive: { type: boolean, example: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 *     AttributeCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "Color" }
 *         code: { type: string, example: "color", description: "If omitted, auto-generated from name" }
 *         type:
 *           type: string
 *           enum: [text, color, size, number, select]
 *           example: color
 *         values:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label: { type: string, example: "Black" }
 *               value: { type: string, example: "#000000" }
 *               meta:
 *                 type: object
 *                 additionalProperties: true
 *         isActive: { type: boolean, example: true }
 *
 *     AttributeUpdate:
 *       type: object
 *       properties:
 *         name: { type: string, example: "Colour" }
 *         code: { type: string, example: "colour" }
 *         type:
 *           type: string
 *           enum: [text, color, size, number, select]
 *         isActive: { type: boolean, example: true }
 *         values:
 *           description: Replace the entire values array (use values endpoints for granular edits)
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttributeValue'
 *
 *     AttributesMeta:
 *       type: object
 *       properties:
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 10 }
 *         total: { type: integer, example: 42 }
 *         pages: { type: integer, example: 5 }
 *         sortBy:
 *           type: string
 *           enum: [createdAt, name, code, type, isActive]
 *           example: createdAt
 *         order:
 *           type: string
 *           enum: [asc, desc]
 *           example: desc
 *         hasPrev: { type: boolean, example: false }
 *         hasNext: { type: boolean, example: true }
 *         prevPage: { type: integer, nullable: true, example: null }
 *         nextPage: { type: integer, nullable: true, example: 2 }
 *
 *     PaginatedAttributesResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attribute'
 *         meta:
 *           $ref: '#/components/schemas/AttributesMeta'
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message: { type: string, example: "Attribute deleted successfully" }
 */

/**
 * @swagger
 * /api/attributes:
 *   post:
 *     summary: Create an attribute
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttributeCreate'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Duplicate code
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    await controller.create(req, res);
  })
);

/**
 * @swagger
 * /api/attributes:
 *   get:
 *     summary: List attributes (paginated)
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, example: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "color" }
 *         description: Case-insensitive search on name and code.
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean, example: true }
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, code, type, isActive]
 *           example: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: desc
 *     responses:
 *       200:
 *         description: Paginated attributes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAttributesResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await controller.list(req, res);
  })
);

/**
 * @swagger
 * /api/attributes/{idOrCode}:
 *   get:
 *     summary: Get attribute by id or code
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attribute
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get(
  "/:idOrCode",
  asyncHandler(async (req, res) => {
    await controller.getOne(req, res);
  })
);

/**
 * @swagger
 * /api/attributes/{idOrCode}:
 *   patch:
 *     summary: Update attribute (top-level fields)
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrCode
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttributeUpdate'
 *     responses:
 *       200:
 *         description: Updated attribute
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       409:
 *         description: Duplicate code
 */
router.patch(
  "/:idOrCode",
  asyncHandler(async (req, res) => {
    await controller.update(req, res);
  })
);

/**
 * @swagger
 * /api/attributes/{idOrCode}:
 *   delete:
 *     summary: Delete attribute
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete(
  "/:idOrCode",
  asyncHandler(async (req, res) => {
    await controller.remove(req, res);
  })
);

/**
 * @swagger
 * /api/attributes/{idOrCode}/values:
 *   post:
 *     summary: Add a value to attribute
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrCode
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label]
 *             properties:
 *               label: { type: string, example: "Black" }
 *               value: { type: string, example: "#000000" }
 *               meta:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Attribute with new value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute not found
 */
router.post(
  "/:idOrCode/values",
  asyncHandler(async (req, res) => {
    await controller.addValue(req, res);
  })
);

/**
 * @swagger
 * /api/attributes/{idOrCode}/values/{valueId}:
 *   patch:
 *     summary: Update an attribute value
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrCode
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: valueId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label: { type: string, example: "Jet Black" }
 *               value: { type: string, example: "#111111" }
 *               meta:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Attribute with updated value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute or value not found
 */
router.patch(
  "/:idOrCode/values/:valueId",
  asyncHandler(async (req, res) => {
    await controller.updateValue(req, res);
  })
);

/**
 * @swagger
 * /api/attributes/{idOrCode}/values/{valueId}:
 *   delete:
 *     summary: Remove an attribute value
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrCode
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: valueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attribute after removal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute or value not found
 */
router.delete(
  "/:idOrCode/values/:valueId",
  asyncHandler(async (req, res) => {
    await controller.removeValue(req, res);
  })
);

export default router;
