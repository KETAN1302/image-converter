import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const widthParam = formData.get("width");
    const heightParam = formData.get("height");
    const width = widthParam ? parseInt(widthParam as string, 10) : undefined;
    const height = heightParam ? parseInt(heightParam as string, 10) : undefined;
    const keepAspectRatio = formData.get("keepAspectRatio") === "true";
    const qualityParam = formData.get("quality");
    const parsedQuality = qualityParam ? parseInt(qualityParam as string, 10) : 80;
    const quality = Math.max(1, Math.min(100, isNaN(parsedQuality) ? 80 : parsedQuality));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if ((!width && !height) || (width && width <= 0) || (height && height <= 0)) {
      return NextResponse.json(
        { error: "Valid width and/or height are required" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    let sharpInstance = sharp(imageBuffer).rotate();
    const metadata = await sharpInstance.metadata();

    if (!metadata.format) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    if (keepAspectRatio) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: "inside",
        withoutEnlargement: false,
      });
    } else {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: "fill",
        withoutEnlargement: false,
      });
    }

    let resizedImage: Buffer;
    let contentType = "image/jpeg";
    let extension = "jpg";

    const fmt = metadata.format.toLowerCase();

    switch (fmt) {
      case "png":
        resizedImage = await sharpInstance
          .png({ compressionLevel: 9 })
          .toBuffer();
        contentType = "image/png";
        extension = "png";
        break;

      case "webp":
        resizedImage = await sharpInstance
          .webp({ quality: quality })
          .toBuffer();
        contentType = "image/webp";
        extension = "webp";
        break;

      case "avif":
        resizedImage = await sharpInstance
          .avif({ quality: quality, effort: 4 })
          .toBuffer();
        contentType = "image/avif";
        extension = "avif";
        break;

      case "gif":
        resizedImage = await sharpInstance
          .gif()
          .toBuffer();
        contentType = "image/gif";
        extension = "gif";
        break;

      case "jpeg":
      case "jpg":
      default:
        resizedImage = await sharpInstance
          .jpeg({ quality: quality, mozjpeg: true })
          .toBuffer();
        contentType = "image/jpeg";
        extension = "jpg";
        break;
    }

    const originalName = file.name.split(".").slice(0, -1).join(".") || "image";
    const filename = `resized-${originalName}.${extension}`;

    return new NextResponse(new Uint8Array(resizedImage), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": resizedImage.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error resizing image:", error);
    return NextResponse.json(
      {
        error:
          "Failed to resize image: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Image Resize API",
    version: "1.0",
    maxDuration: "60s",
  });
}
