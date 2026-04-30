import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!(cloudName && apiKey && apiSecret)) {
    return null;
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  };
}

function ensureConfigured() {
  const config = getCloudinaryConfig();
  if (!config) {
    return false;
  }
  cloudinary.config(config);
  return true;
}

export function extractCloudinaryPublicId(url: string | null | undefined) {
  if (!url) return null;

  const uploadedSegment = "/upload/";
  const segmentIndex = url.indexOf(uploadedSegment);
  if (segmentIndex === -1) return null;

  const tail = url.slice(segmentIndex + uploadedSegment.length);
  const firstSlash = tail.indexOf("/");
  if (firstSlash === -1) return null;

  let publicPart = tail.slice(firstSlash + 1);
  publicPart = publicPart.split("?")[0] ?? publicPart;
  const dotIndex = publicPart.lastIndexOf(".");
  if (dotIndex > 0) {
    publicPart = publicPart.slice(0, dotIndex);
  }

  return publicPart || null;
}

export async function deleteCloudinaryAsset(
  cloudinaryId: string | null | undefined,
) {
  if (!cloudinaryId) return;
  if (!ensureConfigured()) {
    console.warn("Skipping Cloudinary delete: credentials are not configured.");
    return;
  }

  try {
    await cloudinary.uploader.destroy(cloudinaryId, {
      invalidate: true,
      resource_type: "image",
    });
  } catch (error) {
    console.error("Failed to delete Cloudinary asset:", error);
  }
}
