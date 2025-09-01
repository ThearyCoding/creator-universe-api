import { Request, Response } from "express";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryStream";

export class UploadController {
    /**
     * POST /api/uploads
     * Field: file
     * Query (optional):
     *  - folder=... (default: env or "uploads")
     *  - resource=image|video|raw|auto (default: auto)
     */
    uploadSingle = async (req: Request, res: Response) => {
        try {
            const file = (req as any).file as Express.Multer.File | undefined;
            if (!file) return res.status(400).json({ message: "No file uploaded" });

            const folder = String(req.query.folder ?? "");
            const resource = (String(req.query.resource ?? "auto") as any);

            const result = await uploadBufferToCloudinary(file.buffer, {
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
        } catch (err: any) {
            console.error("uploadSingle error:", err);
            return res.status(500).json({ message: "Upload failed", details: err?.message });
        }
    };

    /**
     * POST /api/uploads/many
     * Field: files[]
     */
    uploadMany = async (req: Request, res: Response) => {
        try {
            const files = (req as any).files as Express.Multer.File[] | undefined;
            if (!files?.length) return res.status(400).json({ message: "No files uploaded" });

            const folder = String(req.query.folder ?? "");
            const resource = (String(req.query.resource ?? "auto") as any);

            const results = await Promise.all(
                files.map((f) =>
                    uploadBufferToCloudinary(f.buffer, {
                        folder: folder || undefined,
                        resource_type: resource,
                    })
                )
            );

            return res.status(201).json(
                results.map((r) => ({
                    public_id: r.public_id,
                    url: r.secure_url,
                    format: r.format,
                    bytes: r.bytes,
                    width: r.width,
                    height: r.height,
                    resource_type: r.resource_type,
                }))
            );
        } catch (err: any) {
            console.error("uploadMany error:", err);
            return res.status(500).json({ message: "Upload failed", details: err?.message });
        }
    };

    /**
     * DELETE /api/uploads/:publicId
     * Param example: my-folder/image_abc123
     * Query (optional): resource=image|video|raw|auto (default: image)
     */
    deleteOne = async (req: Request, res: Response) => {
        try {
            const { publicId } = req.params;
            if (!publicId) return res.status(400).json({ message: "publicId is required" });

            const resource = (String(req.query.resource ?? "image") as any);
            const result = await deleteFromCloudinary(publicId, resource);

            if (result.result === "not found") {
                return res.status(404).json({ message: "Asset not found" });
            }
            return res.json({ message: "Deleted", result: result.result });
        } catch (err: any) {
            console.error("deleteOne error:", err);
            return res.status(500).json({ message: "Delete failed", details: err?.message });
        }
    };
}

export default UploadController;
