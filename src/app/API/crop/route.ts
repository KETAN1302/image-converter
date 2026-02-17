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
    const x = parseInt(formData.get("x") as string) || 0;
    const y = parseInt(formData.get("y") as string) || 0;
    const width = parseInt(formData.get("width") as string);
    const height = parseInt(formData.get("height") as string);
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

    const croppedImage = await sharp(imageBuffer)
      .extract({
        left: x,
        top: y,
        width: width,
        height: height,
      })
      .jpeg({ quality: quality })
      .toBuffer();

    return new NextResponse(new Uint8Array(croppedImage), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'attachment; filename="cropped-image.jpg"',
      },
    });
  } catch (error) {
    console.error("Error cropping image:", error);
    return NextResponse.json(
      { error: "Failed to crop image" },
      { status: 500 },
    );
  }
}
