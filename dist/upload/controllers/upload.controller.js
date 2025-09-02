"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const cloudinaryStream_1 = require("../utils/cloudinaryStream");
class UploadController {
    constructor() {
        /**
         * POST /api/uploads
         * Field: file
         * Query (optional):
         *  - folder=... (default: env or "uploads")
         *  - resource=image|video|raw|auto (default: auto)
         */
        this.uploadSingle = async (req, res) => {
            try {
                const file = req.file;
                if (!file)
                    return res.status(400).json({ message: "No file uploaded" });
                const folder = String(req.query.folder ?? "");
                const resource = String(req.query.resource ?? "auto");
                const result = await (0, cloudinaryStream_1.uploadBufferToCloudinary)(file.buffer, {
                    folder: folder || undefined,
                    resource_type: resource,
                });
                return res.status(201).json({
                    public_id: result.public_id,
                    url: result.secure_url,
                    format: result.format,
                    bytes: result.bytes,
                    width: result.width,
                    height: result.height,
                    resource_type: result.resource_type,
                });
            }
            catch (err) {
                console.error("uploadSingle error:", err);
                return res.status(500).json({ message: "Upload failed", details: err?.message });
            }
        };
        /**
         * POST /api/uploads/many
         * Field: files[]
         */
        this.uploadMany = async (req, res) => {
            try {
                const files = req.files;
                if (!files?.length)
                    return res.status(400).json({ message: "No files uploaded" });
                const folder = String(req.query.folder ?? "");
                const resource = String(req.query.resource ?? "auto");
                const results = await Promise.all(files.map((f) => (0, cloudinaryStream_1.uploadBufferToCloudinary)(f.buffer, {
                    folder: folder || undefined,
                    resource_type: resource,
                })));
                return res.status(201).json(results.map((r) => ({
                    public_id: r.public_id,
                    url: r.secure_url,
                    format: r.format,
                    bytes: r.bytes,
                    width: r.width,
                    height: r.height,
                    resource_type: r.resource_type,
                })));
            }
            catch (err) {
                console.error("uploadMany error:", err);
                return res.status(500).json({ message: "Upload failed", details: err?.message });
            }
        };
        /**
         * DELETE /api/uploads/:publicId
         * Param example: my-folder/image_abc123
         * Query (optional): resource=image|video|raw|auto (default: image)
         */
        this.deleteOne = async (req, res) => {
            try {
                const { publicId } = req.params;
                if (!publicId)
                    return res.status(400).json({ message: "publicId is required" });
                const resource = String(req.query.resource ?? "image");
                const result = await (0, cloudinaryStream_1.deleteFromCloudinary)(publicId, resource);
                if (result.result === "not found") {
                    return res.status(404).json({ message: "Asset not found" });
                }
                return res.json({ message: "Deleted", result: result.result });
            }
            catch (err) {
                console.error("deleteOne error:", err);
                return res.status(500).json({ message: "Delete failed", details: err?.message });
            }
        };
    }
}
exports.UploadController = UploadController;
exports.default = UploadController;
