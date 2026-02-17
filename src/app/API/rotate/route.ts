import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const angle = parseInt(formData.get("angle") as string) || 0;
    const quality = parseInt(formData.get("quality") as string) || 80;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    const rotatedImage = await sharp(imageBuffer)
      .rotate(angle)
      .jpeg({ quality: quality })
      .toBuffer();

    return new NextResponse(new Uint8Array(rotatedImage), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'attachment; filename="rotated-image.jpg"',
      },
    });
  } catch (error) {
    console.error("Error rotating image:", error);
    return NextResponse.json(
      { error: "Failed to rotate image" },
      { status: 500 },
    );
  }
}
