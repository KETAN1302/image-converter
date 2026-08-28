"use client";

import { useState, useEffect } from "react";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import JSZip from "jszip";

// PDF.js UMD types
declare global {
  interface Window {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    pdfjsLib: any;
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
let pdfJsPromise: Promise<any> | null = null;

// Dynamic script loader for client-side PDF.js rendering
const loadPdfJs = async () => {
  if (typeof window === "undefined") return null;
  if (window.pdfjsLib) return window.pdfjsLib;
  if (pdfJsPromise) return pdfJsPromise;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  pdfJsPromise = new Promise<any>((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="pdf.min.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      });
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("Failed to load PDF.js library"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js script"));
    document.body.appendChild(script);
  });

  return pdfJsPromise;
};

interface PdfPageInfo {
  name: string;
  size: number;
  totalPages: number;
}

const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
  if (!rangeStr.trim()) {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr.trim());
      const end = parseInt(endStr.trim());

      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        const actualEnd = Math.min(end, maxPages);
        for (let i = start; i <= actualEnd; i++) {
          pages.add(i);
        }
      }
    } else {
      const page = parseInt(trimmed);
      if (!isNaN(page) && page > 0 && page <= maxPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
};

export default function PdfToImagePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfPageInfo | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Conversion Options
  const [outputFormat, setOutputFormat] = useState("png");
  const [scale, setScale] = useState(2); // 1 = 1x, 2 = 2x, 3 = 3x
  const [pageRange, setPageRange] = useState("");
  const [rangeType, setRangeType] = useState("all"); // "all" or "custom"

  // Results
  const [convertedImages, setConvertedImages] = useState<
    {
      pageNumber: number;
      dataUrl: string;
    }[]
  >([]);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const [zipFileName, setZipFileName] = useState<string | null>(null);

  // Clean up Object URLs when component unmounts or zip changes
  useEffect(() => {
    return () => {
      if (zipDownloadUrl) {
        URL.revokeObjectURL(zipDownloadUrl);
      }
    };
  }, [zipDownloadUrl]);

  const processPdfFile = async (file: File) => {
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF document.");
      return;
    }

    setIsLoadingPdf(true);
    setError(null);
    setPdfFile(file);
    setConvertedImages([]);
    setZipDownloadUrl(null);

    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfInfo({
        name: file.name,
        size: file.size,
        totalPages: pdf.numPages,
      });
    } catch (err: unknown) {
      console.error(err);
      setError(
        "Error parsing PDF file. It might be password protected or corrupted.",
      );
      setPdfFile(null);
      setPdfInfo(null);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleCancel = () => {
    setPdfFile(null);
    setPdfInfo(null);
    setConvertedImages([]);
    setZipDownloadUrl(null);
    setError(null);
    setIsConverting(false);
    setConversionProgress(0);
  };

  const handleConvert = async () => {
    if (!pdfFile || !pdfInfo) return;
    setIsConverting(true);
    setConversionProgress(0);
    setError(null);
    setConvertedImages([]);
    setZipDownloadUrl(null);

    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const targetPages =
        rangeType === "all"
          ? Array.from({ length: pdfInfo.totalPages }, (_, i) => i + 1)
          : parsePageRange(pageRange, pdfInfo.totalPages);

      if (targetPages.length === 0) {
        throw new Error(
          "No valid pages selected. Please check your range format.",
        );
      }

      const tempConverted: { pageNumber: number; dataUrl: string }[] = [];
      const zip = new JSZip();
      const baseName = pdfFile.name.replace(/\.pdf$/i, "");

      for (let i = 0; i < targetPages.length; i++) {
        const pageNum = targetPages[i];
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not create 2D canvas rendering context.");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        const mimeType =
          outputFormat === "png"
            ? "image/png"
            : outputFormat === "webp"
              ? "image/webp"
              : "image/jpeg";

        const dataUrl = canvas.toDataURL(
          mimeType,
          outputFormat === "png" ? undefined : 0.9,
        );
        tempConverted.push({ pageNumber: pageNum, dataUrl });

        const base64Data = dataUrl.split(",")[1];
        zip.file(`${baseName}-page-${pageNum}.${outputFormat}`, base64Data, {
          base64: true,
        });

        // Update progress
        setConversionProgress(Math.round(((i + 1) / targetPages.length) * 100));

        // Sleep to yield rendering context thread
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      setConvertedImages(tempConverted);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      setZipDownloadUrl(zipUrl);
      setZipFileName(`${baseName}-images.zip`);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to convert PDF. Please try again.",
      );
    } finally {
      setIsConverting(false);
    }
  };

  const clearAll = () => {
    setPdfFile(null);
    setPdfInfo(null);
    setConvertedImages([]);
    setZipDownloadUrl(null);
    setZipFileName(null);
    setError(null);
    setPageRange("");
    setRangeType("all");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="PDF to Image Converter"
        subtitle="Convert your PDF document pages into high-quality images"
        gradient="from-blue-600 to-cyan-600"
      />

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-3">
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

        {/* Upload Drop Zone */}
        {!pdfFile && (
          <Dropzone
            onFilesSelected={(files) => {
              if (files[0]) {
                setError(null);
                processPdfFile(files[0]);
              }
            }}
            accept=".pdf,application/pdf"
            icon={DocumentIcon}
            title="Drag & drop your PDF file here"
            dragTitle="Drop PDF file here"
            buttonLabel="Choose PDF File"
            buttonIcon={<DocumentIcon className="w-4 h-4 md:w-5 md:h-5" />}
            ariaLabel="Upload PDF file"
            subtitle="Supports: PDF documents (Max 50MB)"
          />
        )}

        {/* Configuration settings & processing overview */}
        {pdfInfo && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6 mb-6">
            {/* Header info */}
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <DocumentIcon aria-hidden="true" className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                  {pdfInfo.name}
                </p>
                <p className="text-xs font-medium text-gray-950 dark:text-white mt-0.5">
                  {formatFileSize(pdfInfo.size)} • {pdfInfo.totalPages} pages
                </p>
              </div>
            </div>

            {/* Options layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Output Format */}
              <div>
                <label htmlFor="pdf-output-format" className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Output Format
                </label>
                <select
                  id="pdf-output-format"
                  aria-label="Output image format"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="png">PNG - Lossless (Recommended)</option>
                  <option value="jpg">JPEG - Best for smaller file size</option>
                  <option value="webp">WebP - Modern compressed format</option>
                </select>
              </div>

              {/* Rendering scale / DPI */}
              <div>
                <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Resolution / Quality Scale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "1x", desc: "Fast / Compact", val: 1 },
                    { label: "2x", desc: "Balanced / Crisp", val: 2 },
                    { label: "3x", desc: "High Quality", val: 3 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setScale(opt.val)}
                      className={`p-2.5 rounded-md border text-center transition-all ${
                        scale === opt.val
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-bold"
                          : "border-gray-250 dark:border-gray-700 text-gray-950 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold"
                      }`}
                    >
                      <div className="text-sm">{opt.label}</div>
                      <div className="text-[10px] opacity-80 font-medium">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Range selector */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mb-6">
              <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-3">
                Page Selection
              </label>
              <div className="flex flex-col sm:flex-row gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-950 dark:text-white">
                  <input
                    type="radio"
                    name="rangeType"
                    checked={rangeType === "all"}
                    onChange={() => setRangeType("all")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>All Pages ({pdfInfo.totalPages})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-950 dark:text-white">
                  <input
                    type="radio"
                    name="rangeType"
                    checked={rangeType === "custom"}
                    onChange={() => setRangeType("custom")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Custom Range</span>
                </label>
              </div>

              {rangeType === "custom" && (
                <div className="animate-in fade-in duration-200">
                  <input
                    id="pdf-custom-range"
                    type="text"
                    aria-label="Custom page numbers or ranges"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. 1, 3, 5-8"
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs font-medium text-gray-950 dark:text-white mt-2">
                    Enter comma-separated page numbers or ranges (e.g. 1, 3,
                    5-7). Maximum limit is {pdfInfo.totalPages} pages.
                  </p>
                </div>
              )}
            </div>

            {/* Convert Trigger Button */}
            {!isConverting && convertedImages.length === 0 && (
              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-5 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-md transition-all active:scale-98 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 cursor-pointer shadow-sm text-sm md:text-base"
                >
                  <XMarkIcon aria-hidden="true" className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleConvert}
                  className="flex-1 px-5 py-3 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-md transition-all shadow-md active:scale-99 flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
                >
                  <Cog6ToothIcon aria-hidden="true" className="w-5 h-5" />
                  <span>Convert PDF to Images</span>
                </button>
              </div>
            )}

            {/* Rendering Progress Bar */}
            {isConverting && (
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs text-gray-950 dark:text-white mb-1.5 font-bold">
                  <span>
                    Converting PDF pages to {outputFormat.toUpperCase()}...
                  </span>
                  <span>{conversionProgress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner for dynamic imports */}
        {isLoadingPdf && (
          <div className="p-12 text-center">
            <ArrowPathIcon className="w-10 h-10 mx-auto text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-semibold text-gray-950 dark:text-white">
              Reading PDF document structures...
            </p>
          </div>
        )}

        {/* Results view */}
        {convertedImages.length > 0 && !isConverting && (
          <div className="mt-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-950 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                  Rendered Pages ({convertedImages.length})
                </h2>
                <p className="text-xs font-medium text-gray-950 dark:text-white mt-1">
                  Successfully parsed pages from local PDF
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {zipDownloadUrl && zipFileName && (
                  <a
                    href={zipDownloadUrl}
                    download={zipFileName}
                    aria-label={`Download all ${convertedImages.length} converted images as ZIP`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold shadow-md transition-colors"
                  >
                    <ArrowDownTrayIcon aria-hidden="true" className="w-4 h-4" />
                    Download All as ZIP
                  </a>
                )}
                <button
                  onClick={clearAll}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-950 dark:text-white rounded-md text-sm font-semibold transition-colors"
                >
                  Convert Another
                </button>
              </div>
            </div>

            {/* Previews Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {convertedImages.map((img) => (
                <div
                  key={img.pageNumber}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  {/* Image container */}
                  <div className="aspect-[3/4] bg-gray-50 dark:bg-gray-800 relative w-full overflow-hidden flex items-center justify-center p-2">
                    <div className="relative w-full h-full shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Hover download overlay */}
                    <a
                      href={img.dataUrl}
                      download={`${pdfFile?.name.replace(/\.pdf$/i, "") || "pdf"}-page-${img.pageNumber}.${outputFormat}`}
                      aria-label={`Download page ${img.pageNumber} as ${outputFormat.toUpperCase()}`}
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                    >
                      <div className="bg-white text-gray-950 rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
                        <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                      </div>
                    </a>
                  </div>

                  {/* Label / Individual download bar */}
                  <div className="p-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <span className="text-xs font-semibold text-gray-950 dark:text-white">
                      Page {img.pageNumber}
                    </span>
                    <a
                      href={img.dataUrl}
                      download={`${pdfFile?.name.replace(/\.pdf$/i, "") || "pdf"}-page-${img.pageNumber}.${outputFormat}`}
                      aria-label={`Download page ${img.pageNumber}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold inline-flex items-center gap-1"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 p-5 bg-blue-50/70 dark:bg-gray-900/50 rounded-2xl border border-blue-100/50 dark:border-gray-800">
          <h3 className="font-bold text-blue-950 dark:text-blue-200 text-sm mb-3">
            💡 Tips for PDF to Image conversion
          </h3>
          <ul className="text-xs font-medium text-blue-900 dark:text-blue-100 space-y-2 leading-relaxed">
            <li>
              • <strong>100% Client-Side Processing:</strong> All conversion
              steps occur inside your browser. No files are uploaded to any
              server. Your data remains secure and private.
            </li>
            <li>
              • <strong>Select Ranges:</strong> Use comma-separated integers or
              dash ranges (e.g. <code>1, 3, 5-10</code>) to convert select pages
              and speed up processing times.
            </li>
            <li>
              • <strong>Adjust Scale:</strong> A higher scale generates larger,
              crisper images. Standard <code>2x</code> matches print resolution
              and is recommended for most readable documents.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
