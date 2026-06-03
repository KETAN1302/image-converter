"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import Image from "next/image";
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch("/API/img-to-pdf", {
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
    <main className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5">
            <DocumentTextIcon className="w-8 h-8 text-blue-500 shrink-0" />
            <span className="bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Image to PDF Converter
            </span>
          </h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Convert your images to PDF documents instantly
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full p-8 mb-6 border-3 border-dashed rounded-2xl transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-lg"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-900 hover:shadow-md"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="text-center">
            <DocumentArrowUpIcon
              className={`w-16 h-16 mx-auto mb-4 transition-all duration-300 ${
                isDragging
                  ? "text-blue-500 scale-110"
                  : "text-gray-400 dark:text-gray-650"
              }`}
            />

            <p className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
              {isDragging ? "Drop images here" : "Drag & drop your images here"}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              or click to browse from your device (JPG, PNG, WebP, GIF)
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md active:scale-98 transition-all">
              <PhotoIcon className="w-5 h-5" />
              Select Images
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-300 mt-1 font-semibold"
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
              <h2 className="font-semibold text-gray-700 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Selected Images ({files.length})
              </h2>
              <button
                onClick={clearAll}
                className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold"
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
                  <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0 relative">
                    <FilePreviewImage file={file} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
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
              <h2 className="font-semibold text-gray-700 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                PDF Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Size
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                  <label className="text-sm font-medium text-gray-750 dark:text-gray-300">
                    Image Quality
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {quality}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Higher quality = larger file size
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-750 dark:text-gray-300">
                    Margin
                  </label>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {margin}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
              className="w-full py-3.5 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-800 dark:disabled:to-gray-800 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all shadow-md active:scale-99 flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Converting... {progress}%</span>
                </>
              ) : (
                <>
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Create PDF ({files.length} images)</span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isConverting && (
              <div className="mt-4">
                <div className="h-2 bg-gray-150 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
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
                <DocumentTextIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-700 dark:text-white">
                  {result.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {result.pageCount} pages • {formatFileSize(result.size)}
                </p>
                {result.failedCount > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ {result.failedCount} images failed to convert
                  </p>
                )}
              </div>
              <a
                href={result.data}
                download={result.name}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-5 bg-blue-50/70 dark:bg-gray-900/50 rounded-2xl border border-blue-100/50 dark:border-gray-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-400 text-sm mb-3">
            💡 Tips for best results
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-300/80 space-y-2 leading-relaxed">
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
