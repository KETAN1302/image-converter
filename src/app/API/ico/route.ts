import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import toIco from "to-ico";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sizesJson = formData.get("sizes") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!sizesJson) {
      return NextResponse.json(
        { error: "Missing sizes" },
        { status: 400 }
      );
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be smaller than 4MB" },
        { status: 400 }
      );
    }

    let sizes: number[];
    try {
      sizes = JSON.parse(sizesJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid sizes format" },
        { status: 400 }
      );
    }

    const allowedSizes = [16, 32, 48, 64, 128, 256];
    sizes = sizes.filter((s) => allowedSizes.includes(s));

    if (sizes.length === 0) {
      return NextResponse.json(
        { error: "No valid sizes selected" },
        { status: 400 }
      );
    }

    sizes.sort((a, b) => a - b);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process each size
    const images = await Promise.all(
      sizes.map(async (size) => {
        try {
          // First, ensure we have RGBA with transparency
          const imageBuffer = await sharp(buffer)
            .resize(size, size, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
              withoutEnlargement: false
            })
            .ensureAlpha() // Ensure alpha channel exists
            .toColorspace('srgb')
            .png({
              compressionLevel: 9,
              palette: false,
              quality: 100,
              force: true
            })
            .toBuffer();

          return imageBuffer;
        } catch (err) {
          console.error(`Error processing size ${size}:`, err);
          throw err;
        }
      })
    );

    // Convert to ICO format
    const icoBuffer = await toIco(images, {
      resize: false,
      sizes: sizes,
    });

    const body = new Uint8Array(icoBuffer);
    const filename = `icon_${sizes.join("x")}_32bit.ico`;

    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/x-icon",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": body.length.toString(),
      },
    });
  } catch (error) {
    console.error("ICO conversion error:", error);
    return NextResponse.json(
      { error: "ICO conversion failed. Please check your image and try again." },
      { status: 500 }
    );
  }
}