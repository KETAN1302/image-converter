import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes for large batches
export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 30;
const BATCH_SIZE = 5; // Process 5 images at a time

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const pageSize = (formData.get("pageSize") as string) || "auto";
    const orientation = (formData.get("orientation") as string) || "auto";
    const quality = Number(formData.get("quality")) || 85;
    const margin = Number(formData.get("margin")) || 0;

    // Validation
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 50MB limit` },
          { status: 400 },
        );
      }
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const processedImages = [];
    const failedImages = [];

    // Process images in batches
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const metadata = await sharp(buffer).metadata();

            // Check if valid image
            if (!metadata.format || !metadata.width || !metadata.height) {
              throw new Error("Invalid image format");
            }

            // Optimize image for PDF
            let imageBuffer;
            let imageDimensions = {
              width: metadata.width || 0,
              height: metadata.height || 0,
            };

            // If it's already JPEG and no special processing needed
            if (
              file.type === "image/jpeg" &&
              pageSize === "auto" &&
              margin === 0
            ) {
              imageBuffer = buffer;
            } else {
              // Process image with sharp
              let pipeline = sharp(buffer);

              // Apply margin (reduce image size to account for margin)
              if (margin > 0 && margin < 50) {
                const marginPercent = margin / 100;
                const newWidth = metadata.width
                  ? Math.floor(metadata.width * (1 - marginPercent))
                  : undefined;
                const newHeight = metadata.height
                  ? Math.floor(metadata.height * (1 - marginPercent))
                  : undefined;

                pipeline = pipeline.resize({
                  width: newWidth,
                  height: newHeight,
                  fit: "contain",
                  background: { r: 255, g: 255, b: 255 },
                });
              }

              // Convert to JPEG with specified quality
              const encoded = await pipeline
                .jpeg({
                  quality: quality,
                  mozjpeg: true,
                  progressive: false,
                })
                .toBuffer({ resolveWithObject: true });

              imageBuffer = encoded.data;
              imageDimensions = {
                width: encoded.info.width,
                height: encoded.info.height,
              };
            }

            return {
              buffer: imageBuffer,
              width: imageDimensions.width,
              height: imageDimensions.height,
              name: file.name,
              success: true,
            };
          } catch (error) {
            return {
              name: file.name,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }),
      );

      // Add successful images to PDF
      for (const result of batchResults) {
        if (result.success && result.buffer) {
          try {
            const image = await pdfDoc.embedJpg(result.buffer);

            // Calculate page dimensions based on settings
            let pageWidth = result.width;
            let pageHeight = result.height;

            if (pageSize !== "auto") {
              const [width, height] = getPageSize(pageSize, orientation);
              pageWidth = width;
              pageHeight = height;
            }

            // Ensure dimensions are valid
            if (!pageWidth || !pageHeight) {
              throw new Error("Invalid page dimensions");
            }

            // Add page
            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            // Calculate image position to center on page
            const x = Math.max(0, (pageWidth - result.width) / 2);
            const y = Math.max(0, (pageHeight - result.height) / 2);

            page.drawImage(image, {
              x,
              y,
              width: result.width,
              height: result.height,
            });

            processedImages.push(result.name);
          } catch (error) {
            failedImages.push({
              name: result.name,
              error:
                "Failed to embed in PDF: " +
                (error instanceof Error ? error.message : "Unknown error"),
            });
          }
        } else if (!result.success) {
          failedImages.push({ name: result.name, error: result.error });
        }
      }
    }

    // Check if any images were successfully processed
    if (processedImages.length === 0) {
      return NextResponse.json(
        { error: "No images could be converted to PDF" },
        { status: 400 },
      );
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const output = Buffer.from(pdfBytes);
    const base64 = output.toString("base64");

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName =
      files.length === 1
        ? `${files[0].name.split(".").slice(0, -1).join(".") || "image"}.pdf`
        : `images-${timestamp}.pdf`;

    return NextResponse.json({
      files: [
        {
          name: fileName,
          data: `data:application/pdf;base64,${base64}`,
          size: output.length,
          pageCount: processedImages.length,
          processedCount: processedImages.length,
          failedCount: failedImages.length,
          failedImages: failedImages,
        },
      ],
    });
  } catch (error) {
    console.error("PDF conversion error:", error);
    return NextResponse.json(
      {
        error:
          "PDF conversion failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

// Helper function for page sizes
function getPageSize(size: string, orientation: string): [number, number] {
  const sizes: Record<string, [number, number]> = {
    a4: [595, 842],
    a5: [420, 595],
    letter: [612, 792],
    legal: [612, 1008],
    tabloid: [792, 1224],
  };

  const [width, height] = sizes[size] || sizes["a4"];

  if (orientation === "landscape") {
    return [height, width];
  }

  return [width, height];
}

export async function GET() {
  return NextResponse.json({
    message: "Image to PDF Converter API",
    version: "1.0",
    maxFileSize: "50MB",
    maxFiles: 30,
    features: {
      pageSizes: ["auto", "a4", "a5", "letter", "legal", "tabloid"],
      orientations: ["auto", "portrait", "landscape"],
      quality: "1-100 (default: 85)",
      margin: "0-49%",
    },
  });
}
