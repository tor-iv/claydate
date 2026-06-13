import sharp from "sharp";
import { writeFile } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import { UPLOAD_DIR } from "./constants";

export class UnsupportedFormatError extends Error {
  constructor(format?: string) {
    super(
      format
        ? `Unsupported image format: ${format}. Only jpeg, png, and webp are accepted.`
        : "Unsupported image format. Only jpeg, png, and webp are accepted."
    );
    this.name = "UnsupportedFormatError";
  }
}

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

/**
 * Validates, resizes, and saves an uploaded image.
 *
 * - Accepts JPEG, PNG, and WebP only (validated via sharp metadata — not file
 *   extension). Throws UnsupportedFormatError for anything else.
 * - Resizes to max-width 1200px (won't enlarge smaller images).
 * - Applies EXIF auto-rotation so mobile photos appear right-side-up.
 * - Converts to JPEG at quality 82.
 * - Size enforcement is the CALLER's responsibility before calling this.
 *
 * Returns the bare filename (e.g. "abc123.jpg") — not the full path.
 */
export async function saveUploadedImage(
  buf: Buffer | ArrayBuffer
): Promise<string> {
  const buffer = buf instanceof Buffer ? buf : Buffer.from(new Uint8Array(buf));

  // Detect format from magic bytes via sharp — don't trust the file extension
  const metadata = await sharp(buffer).metadata();

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new UnsupportedFormatError(metadata.format);
  }

  const filename = `${nanoid()}.jpg`;
  const dest = join(UPLOAD_DIR, filename);

  await sharp(buffer)
    // Auto-rotate based on EXIF orientation tag
    .rotate()
    // Resize to max 1200px wide; never upscale
    .resize({ width: 1200, withoutEnlargement: true })
    // Output as JPEG at quality ~82
    .jpeg({ quality: 82 })
    .toFile(dest);

  return filename;
}
