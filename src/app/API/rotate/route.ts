import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const angleParam = formData.get("angle");
    const angle = angleParam ? parseInt(angleParam as string, 10) : 0;
    const qualityParam = formData.get("quality");
    const parsedQuality = qualityParam ? parseInt(qualityParam as string, 10) : 80;
    const quality = Math.max(1, Math.min(100, isNaN(parsedQuality) ? 80 : parsedQuality));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    let image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.format) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    // Apply rotation
    image = image.rotate(angle);

    let rotatedImage: Buffer;
    let contentType = "image/jpeg";
    let extension = "jpg";

    const fmt = metadata.format.toLowerCase();

    switch (fmt) {
      case "png":
        rotatedImage = await image
          .png({ compressionLevel: 9 })
          .toBuffer();
        contentType = "image/png";
        extension = "png";
        break;

      case "webp":
        rotatedImage = await image
          .webp({ quality: quality })
          .toBuffer();
        contentType = "image/webp";
        extension = "webp";
        break;

      case "avif":
        rotatedImage = await image
          .avif({ quality: quality, effort: 4 })
          .toBuffer();
        contentType = "image/avif";
        extension = "avif";
        break;

      case "gif":
        rotatedImage = await image
          .gif()
          .toBuffer();
        contentType = "image/gif";
        extension = "gif";
        break;

      case "jpeg":
      case "jpg":
      default:
        rotatedImage = await image
          .jpeg({ quality: quality, mozjpeg: true })
          .toBuffer();
        contentType = "image/jpeg";
        extension = "jpg";
        break;
    }

    const originalName = file.name.split(".").slice(0, -1).join(".") || "image";
    const filename = `rotated-${originalName}.${extension}`;

    return new NextResponse(new Uint8Array(rotatedImage), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": rotatedImage.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error rotating image:", error);
    return NextResponse.json(
      {
        error:
          "Failed to rotate image: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Image Rotate API",
    version: "1.0",
    maxDuration: "60s",
  });
}
