import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { authorizeRoles } from "../../middlewares/authorizeRoles";
import { asyncHandler } from "../../utils/asyncHandler";
import { AdminProductController } from "../controllers/admin.product.controller";

const router = Router();
const controller = new AdminProductController();

/**
 * @swagger
 * tags:
 *   name: AdminProducts
 *   description: Admin-only product management
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
 *     AttributeBasic:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         name: { type: string, nullable: true }
 *         code: { type: string, nullable: true }
 *         type: { type: string, nullable: true }
 *         isActive: { type: boolean, nullable: true }
 *
 *     AttributeResolvedValue:
 *       type: object
 *       additionalProperties: false
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
 *       additionalProperties: false
 *       properties:
 *         attribute: { $ref: '#/components/schemas/AttributeBasic' }
 *         values:
 *           type: array
 *           items: { $ref: '#/components/schemas/AttributeResolvedValue' }
 *         stock: { type: integer, nullable: true }
 *         imageUrl: { type: string, format: uri, nullable: true }
 *
 *     VariantValue:
 *       type: object
 *       properties:
 *         attributeId: { $ref: '#/components/schemas/ObjectId' }
 *         attributesValueId:
 *           oneOf:
 *             - $ref: '#/components/schemas/ObjectId'
 *             - type: array
 *               minItems: 1
 *               items: { $ref: '#/components/schemas/ObjectId' }
 *         stock: { type: integer }
 *         imageUrl: { type: string, format: uri, nullable: true }
 *       required: [attributeId, attributesValueId, stock]
 *
 *     Variant:
 *       type: object
 *       properties:
 *         sku: { type: string }
 *         price: { type: number }
 *         salePrice: { type: number }
 *         values:
 *           type: array
 *           items: { $ref: '#/components/schemas/VariantValue' }
 *         stock: { type: integer }
 *         imageUrl: { type: string, format: uri, nullable: true }
 *         barcode: { type: string, nullable: true }
 *       required: [price, values, stock]
 *
 *     ResolvedVariant:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         sku: { type: string, nullable: true }
 *         price: { type: number }
 *         salePrice: { type: number, nullable: true }
 *         stock: { type: integer }
 *         imageUrl: { type: string, format: uri, nullable: true }
 *         barcode: { type: string, nullable: true }
 *         effectivePrice: { type: number, nullable: true }
 *         discountPercent: { type: integer }
 *         attributesResolved:
 *           type: array
 *           items: { $ref: '#/components/schemas/AttributeResolved' }
 *       required: [ _id, price, stock, attributesResolved ]
 *
 *     AdminProductFlat:
 *       type: object
 *       description: Flat admin product with resolved variants only
 *       additionalProperties: false
 *       properties:
 *         _id: { $ref: '#/components/schemas/ObjectId' }
 *         title: { type: string }
 *         slug: { type: string }
 *         description: { type: string, nullable: true }
 *         brand: { type: string, nullable: true }
 *         category: { $ref: '#/components/schemas/ObjectId' }
 *         mainAttributeId: { $ref: '#/components/schemas/ObjectId' }
 *         imageUrl: { type: string, format: uri }
 *         price: { type: number, nullable: true }
 *         salePrice: { type: number, nullable: true }
 *         offerStart: { type: string, format: date-time, nullable: true }
 *         offerEnd: { type: string, format: date-time, nullable: true }
 *         currency: { type: string, example: "USD" }
 *         stock: { type: integer, nullable: true }
 *         isActive: { type: boolean }
 *         totalStock: { type: integer }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         __v: { type: integer, nullable: true }
 *         variants:
 *           type: array
 *           items: { $ref: '#/components/schemas/ResolvedVariant' }
 *       required:
 *         - _id
 *         - title
 *         - slug
 *         - imageUrl
 *         - currency
 *         - isActive
 *         - totalStock
 *         - createdAt
 *         - updatedAt
 *         - variants
 *
 *     AdminProductListItem:
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
 *         mainAttributeId: { $ref: '#/components/schemas/ObjectId' }
 *         hasVariants: { type: boolean }
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
 *         - createdAt
 *         - updatedAt
 */

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: List products (admin)
 *     description: Minimal listing (no variants or pricing). Use GET /api/admin/products/{idOrSlug} for full details.
 *     tags: [AdminProducts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "tee" }
 *       - in: query
 *         name: brand
 *         schema: { type: string, example: "Acme" }
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
 *         schema: { type: number, example: 10 }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number, example: 30 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-createdAt" }
 *     responses:
 *       200:
 *         description: Paginated products (minimal)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AdminProductListItem' }
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 12 }
 *                 total: { type: integer, example: 120 }
 *                 pages: { type: integer, example: 10 }
 */
router.get(
    "/",
    authenticate,
    authorizeRoles("admin"),
    asyncHandler(async (req, res) => {
        await controller.list(req, res);
    })
);

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     summary: Create a product (admin)
 *     description: Create simple product (no variants) or provide explicit `variants`. `mainBuild` is not supported.
 *     tags: [AdminProducts]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             simple:
 *               value:
 *                 title: "Basic Cotton Tee"
 *                 slug: "basic-cotton-tee"
 *                 imageUrl: "https://cdn.example.com/products/basic-tee.png"
 *                 brand: "Acme"
 *                 currency: "USD"
 *                 price: 12.99
 *                 stock: 120
 *                 isActive: true
 *             variants:
 *               value:
 *                 title: "Premium Crewneck Tee"
 *                 slug: "premium-crewneck-tee"
 *                 imageUrl: "https://cdn.example.com/products/premium-crewneck/main.png"
 *                 brand: "Acme"
 *                 currency: "USD"
 *                 mainAttributeId: "68ba88ce54d06434d762e2b2"
 *                 variants:
 *                   - sku: "TEE-PREM-M-BLK"
 *                     price: 19.99
 *                     salePrice: 17.99
 *                     stock: 25
 *                     imageUrl: "https://cdn.example.com/products/premium-crewneck/m-black.png"
 *                     values:
 *                       - { "attributeId": "68ba88ce54d06434d762e2b2", "attributesValueId": "68ba88ce54d06434d762e2b5", "stock": 10 }
 *                       - { "attributeId": "68b9d650e9f857534e61dc7d", "attributesValueId": "68b9d650e9f857534e61dc7e", "stock": 15 }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       409: { description: Duplicate slug }
 */
router.post(
    "/",
    authenticate,
    authorizeRoles("admin"),
    asyncHandler(async (req, res) => {
        await controller.create(req, res);
    })
);

/**
 * @swagger
 * /api/admin/products/{idOrSlug}:
 *   get:
 *     summary: Get a product (admin, flat; resolved variants)
 *     description: Flat product with a `variants` array (each variant includes `attributesResolved`).
 *     tags: [AdminProducts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Admin product (flat)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProductFlat'
 *       404: { description: Not found }
 */
router.get(
    "/:idOrSlug",
    authenticate,
    authorizeRoles("admin"),
    asyncHandler(async (req, res) => {
        await controller.getOne(req, res);
    })
);

/**
 * @swagger
 * /api/admin/products/{idOrSlug}:
 *   post:
 *     summary: Update a product (admin; POST not PATCH)
 *     tags: [AdminProducts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: "Premium Crewneck Tee v2"
 *             salePrice: 17.49
 *             mainAttributeId: "68ba88ce54d06434d762e2b2"
 *             variants:
 *               - sku: "TEE-PREM-M-BLK"
 *                 price: 19.99
 *                 salePrice: 17.49
 *                 stock: 22
 *                 values:
 *                   - { "attributeId": "68ba88ce54d06434d762e2b2", "attributesValueId": "68ba88ce54d06434d762e2b5", "stock": 10 }
 *                   - { "attributeId": "68b9d650e9f857534e61dc7d", "attributesValueId": "68b9d650e9f857534e61dc7e", "stock": 12 }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
router.post(
    "/:idOrSlug",
    authenticate,
    authorizeRoles("admin"),
    asyncHandler(async (req, res) => {
        await controller.update(req, res);
    })
);
/**
 * @swagger
 * /api/admin/products/delete:
 *   post:
 *     summary: Bulk delete products (admin)
 *     description: Deletes multiple products by `_id`. Provide a non-empty array of ObjectId strings.
 *     tags: [AdminProducts]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkDeleteRequest'
 *           examples:
 *             basic:
 *               summary: Delete two products
 *               value:
 *                 ids:
 *                   - "68c709d4e1e28a7c7730c241"
 *                   - "68c709d4e1e28a7c7730c245"
 *     responses:
 *       200:
 *         description: Deleted count and echoed ids
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkDeleteResponse'
 *             examples:
 *               ok:
 *                 value:
 *                   deletedCount: 2
 *                   ids:
 *                     - "68c709d4e1e28a7c7730c241"
 *                     - "68c709d4e1e28a7c7730c245"
 *       400:
 *         description: Invalid or empty ids payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               empty:
 *                 value: { "message": "Body must include non-empty 'ids' array of ObjectId strings" }
 *               invalid:
 *                 value: { "message": "No valid 24-hex ids provided" }
 *       401:
 *         description: Unauthorized (no/invalid token)
 *       403:
 *         description: Forbidden (not an admin)
 */
router.post(
    "/delete",
    authenticate,
    authorizeRoles("admin"),
    asyncHandler(async (req, res) => {
        await controller.bulkDelete(req, res);
    })
);


export default router;
