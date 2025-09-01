import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const ALLOWED_MIME = new Set([
  // images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // videos (optional; keep if you plan to support)
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});
