import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const xParam = formData.get("x");
    const yParam = formData.get("y");
    const widthParam = formData.get("width");
    const heightParam = formData.get("height");
    const qualityParam = formData.get("quality");

    const x = xParam ? Math.max(0, parseInt(xParam as string, 10) || 0) : 0;
    const y = yParam ? Math.max(0, parseInt(yParam as string, 10) || 0) : 0;
    const width = widthParam ? parseInt(widthParam as string, 10) : 0;
    const height = heightParam ? parseInt(heightParam as string, 10) : 0;
    const parsedQuality = qualityParam ? parseInt(qualityParam as string, 10) : 90;
    const quality = Math.max(1, Math.min(100, isNaN(parsedQuality) ? 90 : parsedQuality));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!width || !height || width <= 0 || height <= 0) {
      return NextResponse.json(
        { error: "Valid width and height are required" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    let image = sharp(imageBuffer).rotate();
    const metadata = await image.metadata();

    if (!metadata.format || !metadata.width || !metadata.height) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    // Clamp coordinates safely within the image dimensions
    const safeLeft = Math.max(0, Math.min(x, metadata.width - 1));
    const safeTop = Math.max(0, Math.min(y, metadata.height - 1));
    const safeWidth = Math.max(1, Math.min(width, metadata.width - safeLeft));
    const safeHeight = Math.max(1, Math.min(height, metadata.height - safeTop));

    image = image.extract({
      left: safeLeft,
      top: safeTop,
      width: safeWidth,
      height: safeHeight,
    });

    let croppedImage: Buffer;
    let contentType = "image/jpeg";
    let extension = "jpg";

    const fmt = metadata.format.toLowerCase();

    switch (fmt) {
      case "png":
        croppedImage = await image
          .png({ compressionLevel: 9 })
          .toBuffer();
        contentType = "image/png";
        extension = "png";
        break;

      case "webp":
        croppedImage = await image
          .webp({ quality: quality })
          .toBuffer();
        contentType = "image/webp";
        extension = "webp";
        break;

      case "avif":
        croppedImage = await image
          .avif({ quality: quality, effort: 4 })
          .toBuffer();
        contentType = "image/avif";
        extension = "avif";
        break;

      case "gif":
        croppedImage = await image
          .gif()
          .toBuffer();
        contentType = "image/gif";
        extension = "gif";
        break;

      case "jpeg":
      case "jpg":
      default:
        croppedImage = await image
          .jpeg({ quality: quality, mozjpeg: true })
          .toBuffer();
        contentType = "image/jpeg";
        extension = "jpg";
        break;
    }

    const originalName = file.name.split(".").slice(0, -1).join(".") || "image";
    const filename = `cropped-${originalName}.${extension}`;

    return new NextResponse(new Uint8Array(croppedImage), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": croppedImage.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error cropping image:", error);
    return NextResponse.json(
      {
        error:
          "Failed to crop image: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Image Crop API",
    version: "1.0",
    maxDuration: "60s",
  });
}
