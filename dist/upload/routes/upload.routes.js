"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const authorizeRoles_1 = require("../../middlewares/authorizeRoles");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
const controller = new upload_controller_1.UploadController();
/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Cloudinary uploads
 */
/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload a single file to Cloudinary (authenticated)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema: { type: string, example: "products" }
 *       - in: query
 *         name: resource
 *         schema: { type: string, enum: [image, video, raw, auto], example: "auto" }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             file:
 *               contentType: [image/jpeg, image/png, image/webp, image/gif, image/svg+xml, video/mp4, video/quicktime, video/webm]
 *     responses:
 *       201:
 *         description: Uploaded
 *       400:
 *         description: No file or invalid type
 *       401:
 *         description: Unauthorized
 */
router.post("/", 
// authenticate,
upload_middleware_1.upload.single("file"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.uploadSingle(req, res);
}));
/**
 * @swagger
 * /api/uploads/many:
 *   post:
 *     summary: Upload multiple files to Cloudinary (authenticated)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema: { type: string, example: "products" }
 *       - in: query
 *         name: resource
 *         schema: { type: string, enum: [image, video, raw, auto], example: "auto" }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Uploaded
 *       400:
 *         description: No files or invalid type
 *       401:
 *         description: Unauthorized
 */
router.post("/many", auth_1.authenticate, upload_middleware_1.upload.array("files", 10), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await controller.uploadMany(req, res);
}));
/**
 * @swagger
 * /api/uploads/{publicId}:
 *   delete:
 *     summary: Delete an asset from Cloudinary (admin)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string }
 *         example: "products/iphone-14-front_abc123"
 *       - in: query
 *         name: resource
 *         schema: { type: string, enum: [image, video, raw, auto], example: "image" }
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
router.delete("/:publicId", auth_1.authenticate, (0, authorizeRoles_1.authorizeRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    controller.deleteOne;
}));
exports.default = router;
