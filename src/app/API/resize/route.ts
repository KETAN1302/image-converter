import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const width = parseInt(formData.get("width") as string);
    const height = parseInt(formData.get("height") as string);
    const keepAspectRatio = formData.get("keepAspectRatio") === "true";
    const quality = parseInt(formData.get("quality") as string) || 80;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!width || !height) {
      return NextResponse.json(
        { error: "Width and height are required" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    let sharp_instance = sharp(imageBuffer);

    if (keepAspectRatio) {
      sharp_instance = sharp_instance.resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      });
    } else {
      sharp_instance = sharp_instance.resize(width, height, {
        fit: "fill",
      });
    }

    const resizedImage = await sharp_instance
      .jpeg({ quality: quality })
      .toBuffer();

    return new NextResponse(new Uint8Array(resizedImage), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'attachment; filename="resized-image.jpg"',
      },
    });
  } catch (error) {
    console.error("Error resizing image:", error);
    return NextResponse.json(
      { error: "Failed to resize image" },
      { status: 500 },
    );
  }
}
