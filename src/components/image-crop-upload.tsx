"use client";

import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Crop, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";


/* ------------------------------------------------------------------ */
/*  Helpers: canvas crop + compress                                   */
/* ------------------------------------------------------------------ */

/** Create an HTMLImageElement from a data URL or blob URL */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Crop the image to the given pixel area, resize to maxDim, and
 * compress to JPEG ≤ targetKB.  Returns a File ready for upload.
 */
async function cropAndCompress(
  imageSrc: string,
  cropPixels: Area,
  maxDim = 800,
  targetKB = 500,
): Promise<File> {
  const img = await loadImage(imageSrc);

  // Source crop rectangle
  const { x, y, width, height } = cropPixels;

  // Compute output size (respect maxDim while keeping square)
  const outSize = Math.min(width, height, maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");

  ctx.drawImage(img, x, y, width, height, 0, 0, outSize, outSize);

  // Binary-search quality to hit ≤ targetKB
  let quality = 0.92;
  let blob: Blob | null = null;
  const targetBytes = targetKB * 1024;

  for (let attempt = 0; attempt < 6; attempt++) {
    blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob || blob.size <= targetBytes) break;
    quality -= 0.12;
    if (quality < 0.3) quality = 0.3;
  }

  if (!blob) throw new Error("Failed to create image blob");

  return new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
}

/* ------------------------------------------------------------------ */
/*  Cloudinary upload via XHR (reuses existing logic)                 */
/* ------------------------------------------------------------------ */
async function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress?: (pct: number) => void,
): Promise<{ secureUrl: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration is missing");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", `hackfest26/${folder}`);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText) as {
          secure_url: string;
          public_id: string;
        };
        resolve({
          secureUrl: response.secure_url,
          publicId: response.public_id,
        });
      } else {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

/* ================================================================== */
/*  PUBLIC COMPONENT                                                  */
/* ================================================================== */
interface ImageCropUploadProps {
  /** Button label */
  label?: string;
  /** Cloudinary folder (inside hackfest26/) */
  folder?: string;
  /** Called with the final Cloudinary secure_url */
  onUpload: (url: string) => void;
  /** Called with extra upload info */
  onUploadInfo?: (info: { secureUrl: string; publicId?: string }) => void;
  /** Aspect ratio for the cropper (default 1 = square) */
  aspect?: number;
  /** Max dimension in px (default 800) */
  maxDim?: number;
  /** Target file size in KB (default 500) */
  targetKB?: number;
}

export function ImageCropUpload({
  label = "Upload Photo",
  folder = "teams",
  onUpload,
  onUploadInfo,
  aspect = 1,
  maxDim = 800,
  targetKB = 500,
}: ImageCropUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Crop dialog state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /* ── File picker ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate size (max 10MB raw input)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  /* ── Crop complete callback ── */
  const onCropComplete = useCallback(
    (_croppedAreaPercentage: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedAreaPixels);
    },
    [],
  );

  /* ── Confirm crop → compress → upload ── */
  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const file = await cropAndCompress(imageSrc, croppedArea, maxDim, targetKB);

      const result = await uploadToCloudinary(file, folder, (pct) =>
        setUploadProgress(pct),
      );

      onUpload(result.secureUrl);
      onUploadInfo?.({ secureUrl: result.secureUrl, publicId: result.publicId });

      // Close dialog
      setImageSrc(null);
    } catch (err) {
      console.error("Crop & upload failed:", err);
      setError("Failed to process and upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /* ── Cancel ── */
  const handleCancel = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setError(null);
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Trigger button */}
      <Button
        type="button"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        className="gap-2 cursor-pointer"
      >
        <Upload className="h-4 w-4" />
        {label}
      </Button>

      {error && !imageSrc && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {/* ── CROP DIALOG ── */}
      <Dialog open={!!imageSrc} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-5 w-5" />
              Crop Photo
            </DialogTitle>
            <DialogDescription>
              Adjust the crop area. The image will be compressed automatically
              before upload.
            </DialogDescription>
          </DialogHeader>

          {/* Cropper area */}
          <div className="relative h-[350px] w-full overflow-hidden rounded-lg bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="grow h-2 cursor-pointer accent-primary"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {zoom.toFixed(1)}×
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {isUploading && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Uploading… {uploadProgress}%
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isUploading || !croppedArea}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Crop & Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
