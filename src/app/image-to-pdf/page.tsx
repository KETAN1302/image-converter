"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ChevronsLeft } from "lucide-react";

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

export default function PdfConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState("auto");
  const [orientation, setOrientation] = useState("auto");
  const [quality, setQuality] = useState("85");
  const [margin, setMargin] = useState("0");
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setResult(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please select at least one image");
      return;
    }

    setIsConverting(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("pageSize", pageSize);
    formData.append("orientation", orientation);
    formData.append("quality", quality);
    formData.append("margin", margin);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);

    try {
      const res = await fetch("/api/img-to-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      setResult(data.files[0]);
      setProgress(100);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Conversion failed");
      }
    } finally {
      clearInterval(progressInterval);
      setIsConverting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center min-w-[70px]">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-base font-semibold text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ChevronsLeft className="w-5 h-5" />
              <span>Home</span>
            </Link>
          </div>
          <div className="text-center px-2">
            <h1 className="text-xl md:text-2xl font-bold flex items-center justify-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-blue-500 shrink-0" />
              <span className="bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Image to PDF Converter
              </span>
            </h1>
            <p className="font-medium text-xs md:text-sm text-gray-950 dark:text-white">
              Convert your images to PDF documents instantly
            </p>
          </div>
          <div className="flex items-center justify-end min-w-[70px]">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Drop Zone */}
        <div className="mb-4 md:mb-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative w-full p-6 md:p-8 mb-4 border-3 border-dashed rounded-2xl
              transition-all duration-300 cursor-pointer
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-lg"
                  : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-900 hover:shadow-md"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              aria-label="Select images to convert to PDF"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="text-center">
              <DocumentArrowUpIcon
                aria-hidden="true"
                className={`w-12 h-12 md:w-20 md:h-20 mx-auto mb-2 md:mb-4 transition-all duration-300 ${
                  isDragging
                    ? "text-blue-500 scale-110"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              />

              <p className="text-base md:text-xl font-bold text-gray-950 dark:text-white mb-1 md:mb-2">
                {isDragging
                  ? "Drop images here"
                  : isMobile
                    ? "Tap to upload"
                    : "Drag & drop your images here"}
              </p>

              <p className="text-xs md:text-sm font-medium text-gray-950 dark:text-white mb-3 md:mb-4">
                Supports: JPG, PNG, WebP, GIF (Max 50MB per file)
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white text-sm md:text-base font-semibold rounded-xl active:bg-blue-700 hover:bg-blue-700 transition-colors shadow-md active:shadow-lg cursor-pointer"
                >
                  <PhotoIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Choose Images</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
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
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 rounded-xl"
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
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="auto">Auto (match image size)</option>
                  <option value="a4">A4</option>
                  <option value="a5">A5</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                  <option value="tabloid">Tabloid</option>
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
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="auto">Auto (follow image)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
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
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="w-full py-3.5 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-800 dark:disabled:to-gray-800 disabled:text-gray-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-99 flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Converting... {progress}%</span>
                </>
              ) : (
                <>
                  <DocumentTextIcon aria-hidden="true" className="w-5 h-5" />
                  <span>Create PDF ({files.length} images)</span>
                </>
              )}
            </button>

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
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
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
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
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
