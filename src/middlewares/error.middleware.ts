// In your errorHandler.ts file

import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer'; // 👈 Make sure to import MulterError

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (
  err: any, // Use `any` to be able to check for specific properties
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Your existing logic to set a default status code is great.
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // --- ADD THIS SECTION to handle specific upload errors ---
  if (err.message === 'Unsupported file type') {
    statusCode = 415; // 415 Unsupported Media Type
  }

  // 2. Check for other common multer errors (like file size)
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413; // 413 Payload Too Large
      message = `File is too large. Maximum size is 10MB.`;
    }
  }
  // --- END OF ADDED SECTION ---

  res.status(statusCode).json({
    message: message,
    // Your existing logic for the stack trace is perfect.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};