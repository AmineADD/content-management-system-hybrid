export interface WebpConversionResult {
  blob: Blob;
  width: number;
  height: number;
  originalBytes: number;
  bytes: number;
  quality: number;
}

export const ONE_MB = 1024 * 1024;

const DEFAULT_MAX_DIMENSION = 1920;
const QUALITY_STEPS = [0.92, 0.85, 0.78, 0.7, 0.6, 0.5, 0.4];
const DOWNSCALE_FACTOR = 0.8;
const MIN_SCALE = 0.25;

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(
          new Error("WebP encoding failed — this browser may not support it."),
        );
      },
      "image/webp",
      quality,
    );
  });
}

// Decode any browser-supported image, re-encode to webp, and shrink (quality
// then dimensions) until it fits under maxBytes so the bucket's webp/size rules
// are always satisfied before upload.
export async function convertImageToWebp(
  file: File,
  maxBytes: number = ONE_MB,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): Promise<WebpConversionResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selected file is not an image.");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  try {
    const fitScale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );

    let smallest: Blob | null = null;
    let scale = fitScale;

    while (scale >= MIN_SCALE) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get a 2D canvas context.");
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToWebpBlob(canvas, quality);
        if (!smallest || blob.size < smallest.size) smallest = blob;
        if (blob.size <= maxBytes) {
          return {
            blob,
            width,
            height,
            originalBytes: file.size,
            bytes: blob.size,
            quality,
          };
        }
      }

      scale *= DOWNSCALE_FACTOR;
    }

    const smallestKb = smallest ? Math.round(smallest.size / 1024) : 0;
    throw new Error(
      `Could not compress under ${Math.round(maxBytes / 1024)} KB ` +
        `(smallest reached ${smallestKb} KB). Try a less detailed image.`,
    );
  } finally {
    bitmap.close();
  }
}
