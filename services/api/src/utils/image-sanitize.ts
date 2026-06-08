/** Strip EXIF/metadata from images before encryption. Falls back to original buffer if processing fails. */
export async function sanitizeFileBuffer(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!mimeType.startsWith("image/")) return buffer;
  try {
    const sharp = await import("sharp");
    return await sharp.default(buffer).rotate().withMetadata({ exif: undefined }).toBuffer();
  } catch {
    return buffer;
  }
}
