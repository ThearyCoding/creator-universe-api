"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
const streamifier_1 = __importDefault(require("streamifier"));
function uploadBufferToCloudinary(buffer, opts = {}) {
    const { folder = process.env.CLOUDINARY_FOLDER || "uploads", resource_type = "auto", public_id, overwrite = true, transformation, } = opts;
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder, resource_type, public_id, overwrite, transformation }, (err, result) => {
            if (err)
                return reject(err);
            if (!result)
                return reject(new Error("Cloudinary returned no result"));
            resolve(result);
        });
        streamifier_1.default.createReadStream(buffer).pipe(uploadStream);
    });
}
async function deleteFromCloudinary(publicId, resource_type = "image") {
    return cloudinary_1.default.uploader.destroy(publicId, { resource_type });
}
