"use client";

import { useState, useRef, DragEvent } from "react";
import {
  DocumentTextIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

type ConvertedImage = {
  data: string;
  name: string;
  page: number;
};

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("jpg");
  const [quality, setQuality] = useState("85");
  const [dpi, setDpi] = useState("150");
  const [pageRange, setPageRange] = useState("all");
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<ConvertedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState<number | null>(null);

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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setError("Please drop a valid PDF file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid PDF file");
    }
  };

  const removeFile = () => {
    setFile(null);
    setResults([]);
    setTotalPages(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validatePageRange = (range: string, total: number): boolean => {
    if (range === "all") return true;

    const parts = range.split(",");
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (
          isNaN(start) ||
          isNaN(end) ||
          start < 1 ||
          end > total ||
          start > end
        ) {
          return false;
        }
      } else {
        const page = Number(part);
        if (isNaN(page) || page < 1 || page > total) {
          return false;
        }
      }
    }
    return true;
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    if (totalPages && !validatePageRange(pageRange, totalPages)) {
      setError(`Invalid page range. Pages must be between 1 and ${totalPages}`);
      return;
    }

    setIsConverting(true);
    setError(null);
    setResults([]);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);
    formData.append("quality", quality);
    formData.append("dpi", dpi);
    formData.append("pageRange", pageRange);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 200);

    try {
      const res = await fetch("/API/pdf-to-img", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error);

      setResults(data.files || []);
      setTotalPages(data.totalPages);
      setProgress(100);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Conversion failed");
      }
    } finally {
      clearInterval(interval);
      setIsConverting(false);
    }
  };

  const downloadAll = () => {
    results.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = file.data;
        link.download = file.name;
        link.click();
      }, index * 200); // Delay to prevent browser blocking
    });
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <DocumentTextIcon className="w-8 h-8 text-green-600" />
            <span className="bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              PDF to Image Converter
            </span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-white mt-1">
            Convert PDF pages to JPG, PNG, or WebP images
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
                ? "border-green-500 bg-green-50 scale-102 shadow-lg"
                : "border-gray-300 hover:border-green-400 bg-white dark:bg-gray-900 hover:shadow-md"
            }
            ${file ? "bg-green-50 border-green-300" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="text-center">
            {!file ? (
              <>
                <DocumentArrowDownIcon
                  className={`w-16 h-16 mx-auto mb-4 transition-all duration-300 ${
                    isDragging ? "text-green-500 scale-110" : "text-gray-400 dark:text-white"
                  }`}
                />

                <p className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
                  {isDragging ? "Drop PDF here" : "Drag & drop your PDF here"}
                </p>

                <p className="text-sm text-gray-500 dark:text-white mb-4">
                  or click to select file (max 100MB)
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm">
                  <DocumentTextIcon className="w-4 h-4" />
                  Select PDF
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-10 h-10 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-700 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-white">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="p-2 text-gray-400 dark:text-white hover:text-red-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            )}
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

        {/* Conversion Options */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-green-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-white flex items-center gap-2">
              <Cog6ToothIcon className="w-5 h-5 text-green-600" />
              Conversion Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-white mb-1">
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
              >
                <option value="jpg">JPG - Best for photos</option>
                <option value="png">PNG - Lossless, transparency</option>
                <option value="webp">WebP - Modern web format</option>
              </select>
            </div>

            {/* Page Range */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-white mb-1">
                Page Range
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 1-5, 7, 9-12 or 'all'"
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
              />
              {totalPages && (
                <p className="text-xs text-gray-500 mt-1">
                  PDF has {totalPages} pages. Use format: 1-5, 8, 11-13
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Quality Slider */}
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
            </div>

            {/* DPI Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-white mb-1">
                DPI: {dpi}
              </label>
              <select
                value={dpi}
                onChange={(e) => setDpi(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
              >
                <option value="72">72 DPI (Web/Screen)</option>
                <option value="150">150 DPI (Standard)</option>
                <option value="300">300 DPI (Print Quality)</option>
                <option value="600">600 DPI (High Quality)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-white mt-1">
                Higher DPI = larger file size, better quality
              </p>
            </div>
          </div>
        </div>

        {/* Convert Button */}
        {file && (
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className={`
              w-full py-4 rounded-xl font-semibold text-lg
              transition-all duration-200 flex items-center justify-center gap-2
              ${
                !isConverting
                  ? "bg-linear-to-r from-green-600 to-blue-600 text-white hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                <PhotoIcon className="w-5 h-5" />
                <span>Convert to Images</span>
              </>
            )}
          </button>
        )}

        {/* Progress Bar */}
        {isConverting && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-white">
                Converted Images ({results.length} pages)
              </h2>
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((file, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 relative group">
                    <img
                      src={file.data}
                      alt={file.name}
                      className="object-contain"
                    />
                    <a
                      href={file.data}
                      download={file.name}
                      className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center"
                    >
                      <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowDownTrayIcon className="w-5 h-5 text-gray-700" />
                      </div>
                    </a>
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs text-gray-600 dark:text-white">Page {file.page}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">
            📌 Tips for best results
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• For web use, 150 DPI with JPG format is perfect</li>
            <li>• For printing, use 300 DPI or higher with PNG format</li>
            <li>• Use page range to convert only specific pages</li>
            <li>• WebP format offers best compression for web</li>
            <li>• Maximum 50 pages per PDF</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
