import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes for large PDFs
export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for PDFs
const MAX_PAGES = 50; // Maximum pages to convert

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const format = formData.get("format") as string || "jpg";
    const quality = Number(formData.get("quality")) || 85;
    const pageRange = formData.get("pageRange") as string || "all";
    const dpi = Number(formData.get("dpi")) || 150;

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "PDF file exceeds 100MB limit" },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Read PDF file
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(bytes);
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      return NextResponse.json(
        { error: "PDF has no pages" },
        { status: 400 }
      );
    }

    if (pageCount > MAX_PAGES) {
      return NextResponse.json(
        { error: `PDF has ${pageCount} pages. Maximum allowed is ${MAX_PAGES}` },
        { status: 400 }
      );
    }

    // Parse page range
    let pagesToConvert: number[] = [];
    if (pageRange === 'all') {
      pagesToConvert = Array.from({ length: pageCount }, (_, i) => i);
    } else {
      const parts = pageRange.split(',').map(p => p.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          for (let i = start - 1; i < Math.min(end, pageCount); i++) {
            if (i >= 0) pagesToConvert.push(i);
          }
        } else {
          const page = Number(part) - 1;
          if (page >= 0 && page < pageCount) {
            pagesToConvert.push(page);
          }
        }
      }
    }

    // Remove duplicates and sort
    pagesToConvert = [...new Set(pagesToConvert)].sort((a, b) => a - b);

    if (pagesToConvert.length === 0) {
      return NextResponse.json(
        { error: "No valid pages to convert" },
        { status: 400 }
      );
    }

    // Convert each page to image
    const images: { name: string; data: string; page: number }[] = [];

    for (let i = 0; i < pagesToConvert.length; i++) {
      const pageIndex = pagesToConvert[i];
      
      try {
        // Get page as image (simplified - in production use a proper PDF renderer)
        // Note: pdf-lib doesn't render PDFs to images
        // For production, consider using:
        // - pdf-poppler
        // - pdf2pic
        // - muPDF
        
        // This is a placeholder - you'll need a proper PDF rendering library
        const page = pdfDoc.getPage(pageIndex);
        const { width, height } = page.getSize();
        
        // Create a simple placeholder image (you'll replace this with actual rendering)
        const svgBuffer = Buffer.from(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white"/>
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="black" text-anchor="middle">
              Page ${pageIndex + 1}
            </text>
            <text x="50%" y="60%" font-family="Arial" font-size="16" fill="gray" text-anchor="middle">
              PDF Page Preview
            </text>
          </svg>
        `);

        // Convert SVG to raster image
        let imageBuffer;
        const pipeline = sharp(svgBuffer).resize({
          width: Math.round(width * dpi / 72),
          height: Math.round(height * dpi / 72),
          fit: 'contain'
        });

        if (format === 'png') {
          imageBuffer = await pipeline.png({ quality }).toBuffer();
        } else if (format === 'jpg' || format === 'jpeg') {
          imageBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        } else if (format === 'webp') {
          imageBuffer = await pipeline.webp({ quality }).toBuffer();
        } else {
          imageBuffer = await pipeline.jpeg({ quality }).toBuffer();
        }

        const base64 = imageBuffer.toString('base64');
        const pageNumber = (pageIndex + 1).toString().padStart(3, '0');
        
        images.push({
          name: `page-${pageNumber}.${format === 'jpeg' ? 'jpg' : format}`,
          data: `data:image/${format === 'jpeg' ? 'jpeg' : format};base64,${base64}`,
          page: pageIndex + 1
        });

      } catch (pageError) {
        console.error(`Error converting page ${pageIndex + 1}:`, pageError);
        // Continue with other pages
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No pages could be converted" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      files: images,
      totalPages: pageCount,
      convertedPages: images.length,
      originalName: file.name
    });

  } catch (error) {
    console.error("PDF conversion error:", error);
    return NextResponse.json(
      { error: "PDF conversion failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PDF to Image Converter API",
    version: "1.0",
    maxFileSize: "100MB",
    maxPages: 50,
    supportedFormats: ["jpg", "png", "webp"],
    note: "For production, install pdf2pic or muPDF for actual PDF rendering"
  });
}