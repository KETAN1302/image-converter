import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const quality = parseInt(formData.get("quality") as string) || 60;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    const compressedImage = await sharp(imageBuffer)
      .jpeg({ quality: quality })
      .toBuffer();

    return new NextResponse(new Uint8Array(compressedImage), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'attachment; filename="compressed-image.jpg"',
      },
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    return NextResponse.json(
      { error: "Failed to compress image" },
      { status: 500 },
    );
  }
}
