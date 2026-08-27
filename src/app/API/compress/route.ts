import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const qualityParam = formData.get("quality");
    const parsedQuality = qualityParam ? parseInt(qualityParam as string, 10) : 60;
    const quality = Math.max(1, Math.min(100, isNaN(parsedQuality) ? 60 : parsedQuality));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    const image = sharp(imageBuffer).rotate();
    const metadata = await image.metadata();

    if (!metadata.format) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    let compressedImage: Buffer;
    let contentType = "image/jpeg";
    let extension = "jpg";

    const fmt = metadata.format.toLowerCase();

    switch (fmt) {
      case "png":
        compressedImage = await image
          .png({
            quality: quality,
            compressionLevel: 9,
            effort: 7,
          })
          .toBuffer();
        contentType = "image/png";
        extension = "png";
        break;

      case "webp":
        compressedImage = await image
          .webp({ quality: quality })
          .toBuffer();
        contentType = "image/webp";
        extension = "webp";
        break;

      case "avif":
        compressedImage = await image
          .avif({ quality: quality, effort: 4 })
          .toBuffer();
        contentType = "image/avif";
        extension = "avif";
        break;

      case "gif":
        compressedImage = await image
          .gif()
          .toBuffer();
        contentType = "image/gif";
        extension = "gif";
        break;

      case "jpeg":
      case "jpg":
      default:
        compressedImage = await image
          .jpeg({ quality: quality, mozjpeg: true })
          .toBuffer();
        contentType = "image/jpeg";
        extension = "jpg";
        break;
    }

    const originalName = file.name.split(".").slice(0, -1).join(".") || "image";
    const filename = `compressed-${originalName}.${extension}`;

    return new NextResponse(new Uint8Array(compressedImage), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": compressedImage.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    return NextResponse.json(
      {
        error:
          "Failed to compress image: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Image Compress API",
    version: "1.0",
    maxDuration: "60s",
  });
}
