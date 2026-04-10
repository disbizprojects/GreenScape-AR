import { v2 as cloudinary } from "cloudinary";

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function ensureConfig() {
  if (!cloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local."
    );
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadKind = "cover" | "model";

export async function uploadToCloudinary(
  buffer: Buffer,
  kind: UploadKind
): Promise<{ url: string; publicId: string }> {
  ensureConfig();

  const folder =
    kind === "cover" ? "greenscape-ar/covers" : "greenscape-ar/models";
  const resourceType = kind === "cover" ? "image" : "raw";

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (err, res) => {
        if (err) reject(err);
        else if (!res?.secure_url) reject(new Error("Upload returned no URL"));
        else resolve({ secure_url: res.secure_url, public_id: res.public_id });
      }
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}
