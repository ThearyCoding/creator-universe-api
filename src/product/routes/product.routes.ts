import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { ProductController } from "../controllers/product.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
const controller = new ProductController();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog (electronics)
 *
 * components:
 *   schemas:
 *     Variant:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         sku: { type: string, example: "IPH14-BLK-128" }
 *         options:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           example: { color: "Black", storage: "128GB" }
 *         price: { type: number, example: 999 }
 *         salePrice: { type: number, example: 899, description: "Active selling price (<= price) within offer window" }
 *         compareAtPrice: { type: number, example: 1099, description: "MSRP/strike-through" }
 *         offerStart: { type: string, format: date-time, example: "2025-08-01T00:00:00.000Z" }
 *         offerEnd: { type: string, format: date-time, example: "2025-09-01T00:00:00.000Z" }
 *         stock: { type: integer, example: 12 }
 *         imageUrl: { type: string, format: uri, example: "https://cdn.example.com/iphone-14-black-128.png" }
 *         barcode: { type: string, example: "0123456789012" }
 *     Product:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string, example: "iPhone 14" }
 *         slug: { type: string, example: "iphone-14" }
 *         description: { type: string, example: "Latest-generation smartphone" }
 *         brand: { type: string, example: "Apple" }
 *         category: { type: string, example: "66cfe0e27a51a6b9c4b27e0a" }
 *         images:
 *           type: array
 *           items: { type: string, format: uri }
 *           example: ["https://cdn.example.com/iphone-14-front.png", "https://cdn.example.com/iphone-14-back.png"]
 *         price: { type: number, example: 999 }
 *         salePrice: { type: number, example: 899 }
 *         compareAtPrice: { type: number, example: 1099 }
 *         offerStart: { type: string, format: date-time }
 *         offerEnd: { type: string, format: date-time }
 *         currency: { type: string, example: "USD" }
 *         stock: { type: integer, example: 25, description: "Simple products only" }
 *         totalStock: { type: integer, example: 25 }
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Variant'
 *         attributes:
 *           type: object
 *           additionalProperties: true
 *           example: { chipset: "A17", ram: "8GB", battery: "3500mAh" }
 *         isActive: { type: boolean, example: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ProductCreate:
 *       type: object
 *       required: [title]
 *       properties:
 *         title: { type: string }
 *         slug: { type: string, example: "iphone-14" }
 *         description: { type: string }
 *         brand: { type: string }
 *         category: { type: string }
 *         images:
 *           type: array
 *           items: { type: string, format: uri }
 *         price: { type: number, description: "Required for simple products (no variants)" }
 *         salePrice: { type: number, description: "Optional sale price (<= price) for simple products" }
 *         compareAtPrice: { type: number }
 *         offerStart: { type: string, format: date-time }
 *         offerEnd: { type: string, format: date-time }
 *         currency: { type: string, example: "USD" }
 *         stock: { type: integer, description: "Required if no variants" }
 *         variants:
 *           type: array
 *           description: "Provide to make this a variant product"
 *           items:
 *             $ref: '#/components/schemas/Variant'
 *         attributes:
 *           type: object
 *           additionalProperties: true
 *         isActive: { type: boolean }
 *     ProductUpdate:
 *       type: object
 *       properties:
 *         title: { type: string }
 *         slug: { type: string }
 *         description: { type: string }
 *         brand: { type: string }
 *         category: { type: string }
 *         images:
 *           type: array
 *           items: { type: string, format: uri }
 *         price: { type: number }
 *         salePrice: { type: number }
 *         compareAtPrice: { type: number }
 *         offerStart: { type: string, format: date-time }
 *         offerEnd: { type: string, format: date-time }
 *         currency: { type: string }
 *         stock: { type: integer }
 *         variants:
 *           type: array
 *           description: "Full replacement of variants array (each with price/salePrice/compareAtPrice/offer* if needed)"
 *           items:
 *             $ref: '#/components/schemas/Variant'
 *         attributes:
 *           type: object
 *           additionalProperties: true
 *         isActive: { type: boolean }
 *     PaginatedProducts:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 12 }
 *         total: { type: integer, example: 120 }
 *         pages: { type: integer, example: 10 }
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Duplicate slug
 */
router.post("/", authenticate, authorizeRoles("admin"), asyncHandler(async (req, res) => {
    await controller.create(req, res);
}));

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products (public)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "iphone" }
 *       - in: query
 *         name: brand
 *         schema: { type: string, example: "Apple" }
 *       - in: query
 *         name: category
 *         schema: { type: string, example: "66cfe0e27a51a6b9c4b27e0a" }
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean, example: true }
 *       - in: query
 *         name: hasVariants
 *         schema: { type: boolean, example: true }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number, example: 500 }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number, example: 1200 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *         description: "One field: price, -price, createdAt, -createdAt"
 *     responses:
 *       200:
 *         description: Paginated products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProducts'
 */
router.get("/", asyncHandler(async (req, res) => {
    await controller.list(req, res);
}));

/**
 * @swagger
 * /api/products/{idOrSlug}:
 *   get:
 *     summary: Get a product by id or slug (public)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Not found
 */
router.get("/:idOrSlug", asyncHandler(async (req, res) => {
    await controller.getOne(req, res);
}));

/**
 * @swagger
 * /api/products/{idOrSlug}:
 *   patch:
 *     summary: Update a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdate'
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       409:
 *         description: Duplicate slug
 */
router.patch("/:idOrSlug", authenticate, authorizeRoles("admin"), asyncHandler(async (req, res) => {
    await controller.update(req, res);
}));

/**
 * @swagger
 * /api/products/{idOrSlug}:
 *   delete:
 *     summary: Delete a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idOrSlug
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
router.delete("/:idOrSlug", authenticate, authorizeRoles("admin"), asyncHandler( async (req, res) => {
    await controller.remove(req, res);
}));

export default router;
