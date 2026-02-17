"use client";

import { useState, useRef, DragEvent } from "react";
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
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
      <div className="sticky top-0 z-10 backdrop-blur-md border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
            <span className="bg-linear-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              Image to PDF Converter
            </span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-white mt-1">
            Convert your images to PDF documents instantly
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative w-full p-8 mb-6 border-3 border-dashed rounded-xl
            transition-all duration-300 cursor-pointer
            ${
              isDragging
                ? "border-blue-500 bg-blue-50 scale-102 shadow-lg"
                : "border-gray-300 dark:border-gray-700 hover:border-blue-400 bg-white dark:bg-gray-900 hover:shadow-md"
            }
          `}
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
                isDragging ? "text-blue-500 scale-110" : "text-gray-400"
              }`}
            />

            <p className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
              {isDragging ? "Drop images here" : "Drag & drop images here"}
            </p>

            <p className="text-sm text-gray-500 dark:text-white mb-4">
              or click to select files (JPG, PNG, WebP, GIF)
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
              <PhotoIcon className="w-4 h-4" />
              Select Images
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700 dark:text-white">
                Selected Images ({files.length})
              </h2>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-white">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 dark:text-white   hover:text-red-500"
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
          <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-blue-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700 dark:text-white flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5 text-blue-500" />
                PDF Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-white mb-1">
                  Page Size
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
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
                <label className="block text-sm font-medium text-gray-600 dark:text-white mb-1">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:text-white dark:bg-gray-800 rounded-lg p-2 text-sm"
                >
                  <option value="auto">Auto (follow image)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-white mb-1">
                  Image Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-white mt-1">
                  Higher quality = larger file size
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-white mb-1">
                  Margin: {margin}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-white mt-1">
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
              className={`
                w-full py-4 rounded-xl font-semibold text-lg
                transition-all duration-200 flex items-center justify-center gap-2
                ${
                  !isConverting
                    ? "bg-linear-to-r from-blue-600 to-blue-600 text-white hover:shadow-lg"
                    : "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                }
              `}
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
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-blue-500 transition-all duration-300"
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
          <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-green-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-700 dark:text-white">
                  {result.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-white">
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">
            💡 Tips for best results
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
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
