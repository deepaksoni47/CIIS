import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
// @ts-expect-error - Express namespace needed for Express.Multer.File type
import type { Express } from "express";

/**
 * File upload validation and configuration
 */

// Allowed MIME types for different file categories
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
] as const;

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Maximum number of files per upload
export const MAX_FILES_PER_UPLOAD = 10;

/**
 * File type validation helper
 */
function isAllowedFileType(
  mimetype: string,
  allowedTypes: readonly string[]
): boolean {
  return allowedTypes.includes(mimetype as (typeof allowedTypes)[number]);
}

/**
 * File extension validation
 */
function isAllowedExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
}

/**
 * Image upload configuration
 */
const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Check MIME type
  if (!isAllowedFileType(file.mimetype, ALLOWED_IMAGE_TYPES)) {
    return cb(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`
      )
    );
  }

  // Check file extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  if (!isAllowedExtension(file.originalname, allowedExtensions)) {
    return cb(
      new Error(
        `Invalid file extension. Allowed extensions: ${allowedExtensions.join(", ")}`
      )
    );
  }

  cb(null, true);
};

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: MAX_FILES_PER_UPLOAD,
  },
  fileFilter: imageFilter,
});

/**
 * Audio upload configuration
 */
const audioFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Check MIME type
  if (!isAllowedFileType(file.mimetype, ALLOWED_AUDIO_TYPES)) {
    return cb(
      new Error(
        `Invalid audio type. Allowed types: ${ALLOWED_AUDIO_TYPES.join(", ")}`
      )
    );
  }

  // Check file extension
  const allowedExtensions = [".mp3", ".mpeg", ".wav", ".webm", ".ogg"];
  if (!isAllowedExtension(file.originalname, allowedExtensions)) {
    return cb(
      new Error(
        `Invalid audio extension. Allowed extensions: ${allowedExtensions.join(", ")}`
      )
    );
  }

  cb(null, true);
};

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE,
    files: 1, // Only one audio file at a time
  },
  fileFilter: audioFilter,
});

/**
 * Video upload configuration
 */
const videoFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Check MIME type
  if (!isAllowedFileType(file.mimetype, ALLOWED_VIDEO_TYPES)) {
    return cb(
      new Error(
        `Invalid video type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(", ")}`
      )
    );
  }

  // Check file extension
  const allowedExtensions = [".mp4", ".webm", ".ogg"];
  if (!isAllowedExtension(file.originalname, allowedExtensions)) {
    return cb(
      new Error(
        `Invalid video extension. Allowed extensions: ${allowedExtensions.join(", ")}`
      )
    );
  }

  cb(null, true);
};

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE,
    files: 1,
  },
  fileFilter: videoFilter,
});

/**
 * Mixed media upload (images + audio)
 */
const mixedMediaFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES];

  if (!isAllowedFileType(file.mimetype, allAllowedTypes)) {
    return cb(
      new Error(
        `Invalid file type. Allowed types: images (jpg, png, gif, webp) and audio (mp3, wav)`
      )
    );
  }

  // Note: Size check happens in multer limits configuration
  cb(null, true);
};

export const uploadMixedMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE, // Use larger limit (audio)
    files: MAX_FILES_PER_UPLOAD,
  },
  fileFilter: mixedMediaFilter,
});

/**
 * Middleware to handle multer errors
 */
export const handleUploadErrors = (
  err: Error | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        res.status(413).json({
          error: "File Too Large",
          message: "File size exceeds the allowed limit",
          maxSize: {
            image: `${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
            audio: `${MAX_AUDIO_SIZE / (1024 * 1024)}MB`,
            video: `${MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
          },
        });
        return;

      case "LIMIT_FILE_COUNT":
        res.status(400).json({
          error: "Too Many Files",
          message: `Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`,
        });
        return;

      case "LIMIT_UNEXPECTED_FILE":
        res.status(400).json({
          error: "Unexpected Field",
          message: "Unexpected file field in request",
        });
        return;

      default:
        res.status(400).json({
          error: "Upload Error",
          message: err.message || "File upload failed",
        });
        return;
    }
  }

  if (err) {
    // Custom validation errors
    res.status(400).json({
      error: "Upload Error",
      message: (err as Error).message || "Invalid file upload",
    });
    return;
  }
};

/**
 * Validate file metadata after upload
 */
export const validateUploadedFiles = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return next();
  }

  try {
    // Check total upload size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = MAX_IMAGE_SIZE * MAX_FILES_PER_UPLOAD;

    if (totalSize > maxTotalSize) {
      return res.status(413).json({
        error: "Upload Too Large",
        message: `Total upload size (${(totalSize / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed (${(maxTotalSize / (1024 * 1024)).toFixed(2)}MB)`,
      });
    }

    // Add file info to request for further processing
    req.body.uploadedFiles = files.map((file) => ({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    }));

    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return res.status(500).json({
      error: "Validation Error",
      message: "Failed to validate uploaded files",
    });
  }
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove any path traversal attempts
  const basename = path.basename(filename);

  // Replace unsafe characters
  const sanitized = basename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .toLowerCase();

  // Limit length
  const maxLength = 100;
  if (sanitized.length > maxLength) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    return name.substring(0, maxLength - ext.length) + ext;
  }

  return sanitized;
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const sanitized = sanitizeFilename(originalName);
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${name}-${timestamp}-${random}${ext}`;
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = async (
  _buffer: Buffer,
  _options: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
  } = {}
): Promise<{ valid: boolean; message?: string }> => {
  // This would require an image processing library like 'sharp'
  // For now, we'll return a placeholder
  // In production, implement with: const sharp = require('sharp');
  return { valid: true };
};

/**
 * Check if buffer is a valid image
 */
export const isValidImage = (buffer: Buffer): boolean => {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // Check magic numbers for common image formats
  const jpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const gif =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38;
  const webp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  return jpg || png || gif || webp;
};

/**
 * Check if buffer is a valid audio file
 */
export const isValidAudio = (buffer: Buffer): boolean => {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // Check magic numbers for common audio formats
  const mp3 =
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) || // MP3 frame header
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33); // ID3 tag

  const wav =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;

  const ogg =
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53;

  return mp3 || wav || ogg;
};

/**
 * Middleware to validate file content matches MIME type
 */
export const validateFileContent = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return next();
  }

  try {
    for (const file of files) {
      if (file.mimetype.startsWith("image/")) {
        if (!isValidImage(file.buffer)) {
          return res.status(400).json({
            error: "Invalid File",
            message: `File ${file.originalname} is not a valid image`,
          });
        }
      } else if (file.mimetype.startsWith("audio/")) {
        if (!isValidAudio(file.buffer)) {
          return res.status(400).json({
            error: "Invalid File",
            message: `File ${file.originalname} is not a valid audio file`,
          });
        }
      }
    }

    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return res.status(500).json({
      error: "Validation Error",
      message: "Failed to validate file content",
    });
  }
};

/**
 * Middleware to prevent path traversal in file operations
 */
export const preventPathTraversal = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { filename, path: filePath } = req.body;

  const pathsToCheck = [filename, filePath].filter(Boolean);

  for (const p of pathsToCheck) {
    if (typeof p === "string" && (p.includes("..") || p.includes("~"))) {
      res.status(400).json({
        error: "Invalid Path",
        message: "Path traversal detected",
      });
      return;
    }
  }

  next();
};
