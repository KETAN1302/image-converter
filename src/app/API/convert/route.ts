import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// Route Segment Config for Next.js 15+
export const dynamic = "force-dynamic"; // Use dynamic rendering
export const maxDuration = 60; // Maximum execution time in seconds (for Vercel)
export const runtime = "nodejs"; // Use Node.js runtime (required for sharp)

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
// Maximum number of files
const MAX_FILES = 20;
// Concurrency for processing files (adjust for CPU availability)
const CONCURRENCY = 3;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const files = formData.getAll("files") as File[];
    const format = formData.get("format") as string;
    const width = formData.get("width")
      ? Number(formData.get("width"))
      : undefined;
    const height = formData.get("height")
      ? Number(formData.get("height"))
      : undefined;
    const quality = formData.get("quality")
      ? Number(formData.get("quality"))
      : 80;

    // Validate inputs
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Check file count limit
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed at once` },
        { status: 400 },
      );
    }

    if (!format) {
      return NextResponse.json(
        { error: "Format is required" },
        { status: 400 },
      );
    }

    // Validate quality range
    if (quality < 1 || quality > 100) {
      return NextResponse.json(
        { error: "Quality must be between 1 and 100" },
        { status: 400 },
      );
    }

    // Validate dimensions
    if ((width && width < 1) || (height && height < 1)) {
      return NextResponse.json(
        { error: "Width and height must be positive numbers" },
        { status: 400 },
      );
    }

    // Check individual file sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 50MB limit` },
          { status: 400 },
        );
      }
    }

    const results: { name: string; data: string; preview?: string }[] = [];

    // Helper to process a single file and return result or null
    const processFile = async (file: File) => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        let image = sharp(buffer);

        // Get metadata to check if it's a valid image
        const metadata = await image.metadata();
        if (!metadata.format) {
          throw new Error("Invalid image file");
        }

        if (width || height) {
          image = image.resize(width, height, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        let output: Buffer;
        const fmt = format.toLowerCase();

        // Handle format conversion
        switch (fmt) {
          case "png":
            output = await image.png({ compressionLevel: 9 }).toBuffer();
            break;
          case "jpg":
          case "jpeg":
            output = await image
              .jpeg({ quality: Math.min(quality, 100) })
              .toBuffer();
            break;
          case "webp":
            output = await image
              .webp({ quality: Math.min(quality, 100) })
              .toBuffer();
            break;
          case "avif":
            output = await image
              .avif({ quality: Math.min(quality, 100), effort: 4 })
              .toBuffer();
            break;
          case "gif":
            output = await image.gif().toBuffer();
            break;
          case "tiff":
            output = await image
              .tiff({ quality: Math.min(quality, 100) })
              .toBuffer();
            break;
          case "heic":
          case "heif":
            // Sharp doesn't support HEVC encoding natively on most setups due to patents.
            // But it supports HEIF saving with AV1 compression (AVIF) which produces a fully valid
            // HEIF container with AV1 compression (.heic/.heif format).
            output = await image
              .heif({ quality: Math.min(quality, 100), compression: "av1" })
              .toBuffer();
            break;
          case "svg": {
            // Convert to PNG buffer first, then wrap as inline base64 in SVG XML template
            const pngBuffer = await image.png({ compressionLevel: 9 }).toBuffer();
            const pngBase64 = pngBuffer.toString("base64");
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${metadata.width || 800}" height="${metadata.height || 600}" viewBox="0 0 ${metadata.width || 800} ${metadata.height || 600}">
  <image href="data:image/png;base64,${pngBase64}" width="100%" height="100%"/>
</svg>`;
            output = Buffer.from(svgContent, "utf-8");
            break;
          }
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        // Generate filename with proper extension and normalized mime type
        const originalName =
          file.name.split(".").slice(0, -1).join(".") || "image";

        let mime: string = fmt;
        if (fmt === "jpg" || fmt === "jpeg") {
          mime = "jpeg";
        } else if (fmt === "svg") {
          mime = "svg+xml";
        }

        let extension = fmt;
        if (fmt === "jpeg") {
          extension = "jpg";
        }

        const fileName = `${originalName}.${extension}`;
        const base64 = output.toString("base64");

        // Generate JPEG preview for formats that web browsers cannot natively render (HEIC/TIFF)
        let preview: string | undefined = undefined;
        if (fmt === "heic" || fmt === "heif" || fmt === "tiff") {
          const previewBuffer = await image
            .jpeg({ quality: 60 })
            .toBuffer();
          preview = `data:image/jpeg;base64,${previewBuffer.toString("base64")}`;
        }

        return {
          name: fileName,
          data: `data:image/${mime};base64,${base64}`,
          preview,
        };
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        return null;
      }
    };

    // Process files in small batches to limit CPU/memory usage
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map((f) => processFile(f)));
      for (const r of batchResults) {
        if (r) results.push(r);
      }
    }

    // Check if any files were successfully converted
    if (results.length === 0) {
      return NextResponse.json(
        { error: "No files could be converted" },
        { status: 400 },
      );
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      {
        error:
          "Conversion failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

// Optional: Add configuration for larger responses if needed
export async function GET() {
  return NextResponse.json({
    message: "Image Converter API",
    version: "1.0",
    maxFileSize: "50MB",
    maxFiles: 20,
    supportedFormats: ["png", "jpg", "jpeg", "webp", "avif", "gif", "svg", "heic", "heif", "tiff"],
  });
}
