import { v2 as cloudinary } from "cloudinary";

/**
 * Initialize Cloudinary with environment variables
 */
export function initializeCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log(
    "✅ Cloudinary initialized:",
    process.env.CLOUDINARY_CLOUD_NAME || "not configured"
  );
}

/**
 * Upload image buffer to Cloudinary
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: string,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Upload failed - no result returned"));
        }
      }
    );

    // Write buffer to upload stream
    uploadStream.end(buffer);
  });
}

export default cloudinary;
