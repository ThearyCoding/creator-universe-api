import cloudinary from "../../config/cloudinary";
import streamifier from "streamifier";

export function uploadBufferToCloudinary(
    buffer: Buffer,
    opts: {
        folder?: string;
        resource_type?: "image" | "video" | "raw" | "auto";
        public_id?: string;
        overwrite?: boolean;
        transformation?: any;
    } = {}
): Promise<any> {
    const {
        folder = process.env.CLOUDINARY_FOLDER || "uploads",
        resource_type = "auto",
        public_id,
        overwrite = true,
        transformation,
    } = opts;

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type, public_id, overwrite, transformation },
            (err, result) => {
                if (err) return reject(err);
                if (!result) return reject(new Error("Cloudinary returned no result"));
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

export async function deleteFromCloudinary(publicId: string, resource_type: "image" | "video" | "raw" | "auto" = "image") {
    return cloudinary.uploader.destroy(publicId, { resource_type });
}
