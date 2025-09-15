// src/modules/products/routes/mobile.products.routes.ts
import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { MobileProductController } from "../controllers/mobile.product.controller";

const router = Router();
const controller = new MobileProductController();

/**
 * @swagger
 * tags:
 *   name: MobileProducts
 *   description: Lightweight public endpoints for mobile apps
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       pattern: "^[a-fA-F0-9]{24}$"
 *       example: "68ba88ce54d06434d762e2b2"
 *
 *     MobileListItem:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         title: { type: string }
 *         slug: { type: string }
 *         brand: { type: string, nullable: true }
 *         imageUrl: { type: string, format: uri }
 *         currency: { type: string, example: "USD" }
 *         category: { $ref: '#/components/schemas/ObjectId' }
 *         isActive: { type: boolean }
 *         totalStock: { type: integer }
 *         hasVariants: { type: boolean }
 *         lowestPrice: { type: number, nullable: true }
 *         highestPrice: { type: number, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *       required:
 *         - _id
 *         - title
 *         - slug
 *         - imageUrl
 *         - currency
 *         - isActive
 *         - totalStock
 *         - hasVariants
 *
 *     AttributeBasic:
 *       type: object
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         name: { type: string, nullable: true }
 *         code: { type: string, nullable: true }
 *         type: { type: string, nullable: true }
 *         isActive: { type: boolean, nullable: true }
 *
 *     AttributeResolvedValue:
 *       type: object
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         label: { type: string, nullable: true }
 *         value: { type: string, nullable: true }
 *         meta:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *
 *     AttributeResolved:
 *       type: object
 *       properties:
 *         attribute: { $ref: '#/components/schemas/AttributeBasic' }
 *         values:
 *           type: array
 *           items: { $ref: '#/components/schemas/AttributeResolvedValue' }
 *
 *     MobileVariant:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         sku: { type: string, nullable: true }
 *         price: { type: number, nullable: true }
 *         salePrice: { type: number, nullable: true }
 *         stock: { type: integer }
 *         imageUrl: { type: string, format: uri, nullable: true }
 *         attributesResolved:
 *           type: array
 *           items: { $ref: '#/components/schemas/AttributeResolved' }
 *       required: [ _id, stock, attributesResolved ]
 *
 *     MobileProductDetail:
 *       type: object
 *       description: Flat, minimal product for mobile detail screens
 *       additionalProperties: false
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         title: { type: string }
 *         slug: { type: string }
 *         brand: { type: string, nullable: true }
 *         imageUrl: { type: string, format: uri }
 *         currency: { type: string }
 *         totalStock: { type: integer }
 *         mainAttribute:
 *           oneOf:
 *             - $ref: '#/components/schemas/AttributeBasic'
 *             - type: "null"
 *         mainOptions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               valueId: { $ref: '#/components/schemas/ObjectId' }
 *               label: { type: string, nullable: true }
 *               meta:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *               sampleImageUrl: { type: string, format: uri, nullable: true }
 *               totalStock: { type: integer }
 *               variantIds:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/ObjectId' }
 *         secondaryAttributes:
 *           type: array
 *           items: { $ref: '#/components/schemas/AttributeBasic' }
 *         variants:
 *           type: array
 *           items: { $ref: '#/components/schemas/MobileVariant' }
 *       required:
 *         - _id
 *         - title
 *         - slug
 *         - imageUrl
 *         - currency
 *         - totalStock
 *         - variants
 */

/**
 * @swagger
 * /api/mobile/products:
 *   get:
 *     summary: List products (mobile, lightweight)
 *     tags: [MobileProducts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "hoodie" }
 *       - in: query
 *         name: brand
 *         schema: { type: string, example: "Acme" }
 *       - in: query
 *         name: category
 *         schema: { $ref: '#/components/schemas/ObjectId' }
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean, example: true }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *     responses:
 *       200:
 *         description: Paginated mobile products (minimal)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/MobileListItem' }
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 12 }
 *                 total: { type: integer, example: 120 }
 *                 pages: { type: integer, example: 10 }
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await controller.list(req, res);
  })
);

/**
 * @swagger
 * /api/mobile/products/{idOrSlug}:
 *   get:
 *     summary: Get product (mobile, flat + resolved variants)
 *     tags: [MobileProducts]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Mobile product detail (flat + minimal)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MobileProductDetail'
 *       404: { description: Not found }
 */
router.get(
  "/:idOrSlug",
  asyncHandler(async (req, res) => {
    await controller.getOne(req, res);
  })
);

export default router;
