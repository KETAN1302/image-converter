import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import toIco from "to-ico";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

const SIZE_LABELS: Record<number, string> = {
  16: "Favicon",
  32: "Browser tab",
  48: "Desktop shortcut",
  64: "High DPI icon",
  128: "Large preview",
  256: "Extra large icon",
};

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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be smaller than 10MB" },
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

    // Process each size and create both PNG buffer and individual ICO buffer
    const iconResults = await Promise.all(
      sizes.map(async (size) => {
        try {
          const pngBuffer = await sharp(buffer)
            .rotate()
            .resize(size, size, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
              withoutEnlargement: false,
            })
            .ensureAlpha()
            .toColorspace("srgb")
            .png({
              compressionLevel: 9,
              palette: false,
              quality: 100,
              force: true,
            })
            .toBuffer();

          const icoBuffer = await toIco([pngBuffer], {
            resize: false,
            sizes: [size],
          });

          return {
            size,
            label: SIZE_LABELS[size] || `${size}x${size}`,
            pngBuffer,
            icoBuffer,
          };
        } catch (err) {
          console.error(`Error processing size ${size}:`, err);
          throw err;
        }
      })
    );

    // Generate combined multi-resolution ICO containing all selected sizes
    const allPngBuffers = iconResults.map((r) => r.pngBuffer);
    const combinedIcoBuffer = await toIco(allPngBuffers, {
      resize: false,
      sizes: sizes,
    });

    const icons = iconResults.map((item) => ({
      size: item.size,
      label: item.label,
      icoName: `favicon${item.size}x${item.size}.ico`,
      icoBase64: item.icoBuffer.toString("base64"),
      icoSize: item.icoBuffer.length,
      pngName: `favicon${item.size}x${item.size}.png`,
      pngBase64: item.pngBuffer.toString("base64"),
      pngSize: item.pngBuffer.length,
    }));

    return NextResponse.json({
      success: true,
      baseName: "favicon",
      combinedIco: {
        name: "favicon-multisize.ico",
        base64: combinedIcoBuffer.toString("base64"),
        size: combinedIcoBuffer.length,
      },
      icons,
    });
  } catch (error) {
    console.error("ICO conversion error:", error);
    return NextResponse.json(
      {
        error:
          "ICO conversion failed: " +
          (error instanceof Error ? error.message : "Please check your image and try again."),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Image to ICO API",
    version: "2.0",
    maxDuration: "60s",
    supportedSizes: [16, 32, 48, 64, 128, 256],
  });
}