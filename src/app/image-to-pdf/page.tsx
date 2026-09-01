"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

import { PDFDocument } from "pdf-lib";

type PdfResult = {
  name: string;
  pageCount: number;
  size: number;
  failedCount: number;
  data: string;
};

function FilePreviewImage({ file }: { file: File }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const handle = requestAnimationFrame(() => {
      setUrl(objectUrl);
    });
    return () => {
      cancelAnimationFrame(handle);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!url) return null;

  return (
    <Image
      src={url}
      alt={file.name}
      fill
      unoptimized
      className="object-cover"
    />
  );
}

export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState("auto");
  const [quality, setQuality] = useState("85");
  const [margin, setMargin] = useState("0");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setIsConverting(false);
    setProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const convertImagesToPdfClient = async (
    imageFiles: File[],
    pSize: string,
    orient: string,
    qual: number,
    marg: number
  ): Promise<PdfResult> => {
    const pdfDoc = await PDFDocument.create();

    const getPageDimensions = (size: string, or: string): [number, number] => {
      const sizes: Record<string, [number, number]> = {
        a4: [595, 842],
        a5: [420, 595],
        letter: [612, 792],
        legal: [612, 1008],
        tabloid: [792, 1224],
      };
      const [w, h] = sizes[size] || sizes["a4"];
      return or === "landscape" ? [h, w] : [w, h];
    };

    let processedCount = 0;

    for (const f of imageFiles) {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(f);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${f.name}`));
        img.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not initialize canvas");

      // Fill white background for transparent PNG/WebP images
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to encode image to JPEG"))),
          "image/jpeg",
          Math.max(0.1, Math.min(1.0, qual / 100))
        );
      });

      const jpegBytes = await jpegBlob.arrayBuffer();
      const pdfImage = await pdfDoc.embedJpg(jpegBytes);

      let pageWidth = w;
      let pageHeight = h;
      const safeMargin = Math.min(Math.max(0, marg) / 100, 0.49);

      if (pSize !== "auto") {
        const [targetW, targetH] = getPageDimensions(pSize, orient);
        pageWidth = targetW;
        pageHeight = targetH;
      } else {
        if (safeMargin > 0 && safeMargin < 0.5) {
          pageWidth = w / (1 - 2 * safeMargin);
          pageHeight = h / (1 - 2 * safeMargin);
        }
      }

      const printableWidth = pageWidth * (1 - 2 * safeMargin);
      const printableHeight = pageHeight * (1 - 2 * safeMargin);

      const scale = Math.min(
        printableWidth / w,
        printableHeight / h
      );
      const drawWidth = w * scale;
      const drawHeight = h * scale;
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(pdfImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });

      processedCount++;
    }

    if (processedCount === 0) {
      throw new Error("No images could be converted to PDF");
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const downloadUrl = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName =
      imageFiles.length === 1
        ? `${imageFiles[0].name.split(".").slice(0, -1).join(".") || "image"}.pdf`
        : `images-${timestamp}.pdf`;

    return {
      name: fileName,
      pageCount: processedCount,
      size: blob.size,
      failedCount: 0,
      data: downloadUrl,
    };
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please select at least one image");
      return;
    }

    setIsConverting(true);
    setError(null);
    setResult(null);
    setProgress(15);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 15;
      });
    }, 80);

    try {
      // 1. Client-Side PDF Generation (instant, handles unlimited images/size, no 4.5MB Vercel limit)
      const clientResult = await convertImagesToPdfClient(
        files,
        pageSize,
        orientation,
        Number(quality) || 85,
        Number(margin) || 0
      );

      setResult(clientResult);
      setProgress(100);
    } catch (clientErr) {
      console.warn("Client PDF creation error, attempting server conversion:", clientErr);
      // 2. Server API fallback
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("pageSize", pageSize);
        formData.append("orientation", orientation);
        formData.append("quality", quality);
        formData.append("margin", margin);

        const res = await fetch("/api/img-to-pdf", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const rawText = await res.text().catch(() => "");
          let errorMsg = "Conversion failed";
          try {
            const parsed = JSON.parse(rawText);
            if (parsed?.error) errorMsg = parsed.error;
          } catch {
            if (res.status === 413) {
              errorMsg = "Total image size exceeds server limit. Please convert fewer images or reduce file size.";
            }
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        setResult(data.files[0]);
        setProgress(100);
      } catch (apiErr) {
        const msg = apiErr instanceof Error ? apiErr.message : "Conversion failed";
        setError(msg);
      }
    } finally {
      clearInterval(progressInterval);
      setIsConverting(false);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setIsConverting(false);
    setProgress(0);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="Image to PDF Converter"
        subtitle="Convert your images to PDF documents"
      />

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Drop Zone */}
        {files.length === 0 && (
          <Dropzone
            multiple
            onFilesSelected={(newFiles) => {
              const imageFiles = newFiles.filter((file) => file.type.startsWith("image/"));
              setFiles((prev) => [...prev, ...imageFiles]);
            }}
            accept="image/*"
            icon={DocumentArrowUpIcon}
            title="Drag & drop your images here"
            dragTitle="Drop images here"
            buttonLabel="Choose Images"
            ariaLabel="Select images to convert to PDF"
            subtitle="Supports: JPG, PNG, WebP, GIF (Max 50MB per file)"
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-1 font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-base md:text-lg text-gray-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Selected Images ({files.length})
              </h2>
              <button
                onClick={clearAll}
                className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 rounded-md"
                >
                  <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 relative">
                    <FilePreviewImage file={file} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs font-medium text-gray-950 dark:text-white">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className="p-1.5 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <XMarkIcon aria-hidden="true" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Options */}
        {files.length > 0 && (
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-base md:text-lg text-gray-950 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                PDF Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pdf-page-size" className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Page Size
                </label>
                <select
                  id="pdf-page-size"
                  aria-label="Page Size"
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium rounded-md p-3 text-sm outline-none transition-all"
                >
                  <option value="auto" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">Auto</option>
                  <option value="a4" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">A4</option>
                  <option value="a5" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">A5</option>
                  <option value="letter" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">Letter</option>
                  <option value="legal" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">Legal</option>
                  <option value="tabloid" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">Tabloid</option>
                </select>
              </div>

              <div>
                <label htmlFor="pdf-orientation" className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Orientation
                </label>
                <select
                  id="pdf-orientation"
                  aria-label="Orientation"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium rounded-md p-3 text-sm outline-none transition-all"
                >
                  <option value="auto" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">Auto</option>
                  <option value="portrait" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">Portrait</option>
                  <option value="landscape" className="bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium">Landscape</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="pdf-quality" className="text-sm font-semibold text-gray-950 dark:text-white">
                    Image Quality
                  </label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {quality}%
                  </span>
                </div>
                <input
                  id="pdf-quality"
                  type="range"
                  aria-label="Image Quality Slider"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs font-medium text-gray-950 dark:text-white mt-2">
                  Higher quality = larger file size
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="pdf-margin" className="text-sm font-semibold text-gray-950 dark:text-white">
                    Margin
                  </label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {margin}%
                  </span>
                </div>
                <input
                  id="pdf-margin"
                  type="range"
                  aria-label="Page Margin Slider"
                  min="0"
                  max="25"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs font-medium text-gray-950 dark:text-white mt-2">
                  Space around the image on the page
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Convert Button */}
        {files.length > 0 && (
          <>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={clearAllFiles}
                className="flex-1 px-5 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-md transition-all active:scale-98 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 cursor-pointer shadow-sm text-sm md:text-base"
              >
                <XMarkIcon aria-hidden="true" className="w-5 h-5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-800 dark:disabled:to-gray-800 disabled:text-gray-500 text-white font-bold rounded-md transition-all shadow-md active:scale-99 flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
              >
                {isConverting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Converting... {progress}%</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon aria-hidden="true" className="w-5 h-5" />
                    <span>Create PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            {isConverting && (
              <div className="mt-4">
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs font-semibold text-center text-gray-950 dark:text-white mt-2">
                  Processing images... {Math.min(progress, 100)}%
                </p>
              </div>
            )}
          </>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center">
                <DocumentTextIcon aria-hidden="true" className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-950 dark:text-white">
                  {result.name}
                </h3>
                <p className="text-sm font-medium text-gray-950 dark:text-white">
                  {result.pageCount} pages • {formatFileSize(result.size)}
                </p>
                {result.failedCount > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-bold">
                    ⚠️ {result.failedCount} images failed to convert
                  </p>
                )}
              </div>
              <a
                href={result.data}
                download={result.name}
                aria-label={`Download generated PDF ${result.name}`}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon aria-hidden="true" className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-5 bg-blue-50/70 dark:bg-gray-900/50 rounded-2xl border border-blue-100/50 dark:border-gray-800">
          <h3 className="font-bold text-blue-950 dark:text-blue-200 text-sm mb-3">
            💡 Tips for best results
          </h3>
          <ul className="text-xs font-medium text-blue-900 dark:text-blue-100 space-y-2 leading-relaxed">
            <li>• Use high-quality images for better PDF output</li>
            <li>• For documents, use A4 size with 0% margin</li>
            <li>• Maximum 30 images at once</li>
            <li>• JPEG images convert fastest (no re-encoding needed)</li>
            <li>• All images become separate pages in the PDF</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
