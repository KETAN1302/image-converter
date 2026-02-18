"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface CompressedFile {
  name: string;
  data: string;
  originalSize: number;
  compressedSize: number;
  preview?: string;
}

export default function CompressImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(60);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CompressedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const processFile = (uploadedFile: File) => {
    if (!uploadedFile.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }
    setError(null);
    setFile(uploadedFile);
    setOriginalSize(uploadedFile.size);
    setCompressedSize(0);
    setResult(null);

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const uploadedFile = e.dataTransfer.files?.[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const compressImage = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", String(quality));

      const response = await fetch("/API/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to compress image");

      const blob = await response.blob();
      setCompressedSize(blob.size);

      // Create preview data URL for result
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setResult({
          name: `compressed-${file.name}`,
          data,
          originalSize,
          compressedSize: blob.size,
          preview,
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      setError("Error compressing image");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const compressionRatio =
    originalSize > 0 && compressedSize > 0
      ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
      : "0";

  const clearAll = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setCompressedSize(0);
    setOriginalSize(0);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Image Compressor
          </h1>
          <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
            Reduce image file sizes with smart compression
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-300 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-6">
          {/* Main Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`relative w-full p-6 md:p-8 border-3 border-dashed rounded transition-all duration-300 cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-lg"
                : "border-gray-300 dark:border-gray-700 hover:border-gray-400 bg-white dark:bg-gray-900 hover:shadow-md"
            }`}
          >
            <div className="text-center">
              <CloudArrowUpIcon
                className={`w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 transition-all duration-300 ${
                  isDragging
                    ? "text-blue-500 scale-110"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              />
              <p className="text-base md:text-xl font-semibold text-gray-700 dark:text-white mb-1">
                {isDragging
                  ? "Drop your image here"
                  : "Drop your image or click to browse"}
              </p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6">
                Supports: JPG, PNG, WebP, GIF (Max 50MB)
              </p>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Select Image
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* File Preview & Options */}
        {file && (
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-700 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                Compression Settings
              </h2>
              <button
                onClick={clearAll}
                className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* File Info */}
            <div className="mb-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
                  {preview && (
                    <Image
                      src={preview}
                      alt={file.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(originalSize)}
                  </p>
                  {uploadProgress < 100 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {uploadProgress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quality Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Quality Presets
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Best (90%)", value: 90 },
                  { label: "High (75%)", value: 75 },
                  { label: "Medium (60%)", value: 60 },
                  { label: "Low (40%)", value: 40 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setQuality(preset.value)}
                    className={`px-4 py-2 rounded font-medium text-sm transition-all transform hover:scale-105 ${
                      quality === preset.value
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Quality Adjustment
                </label>
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          </div>
        )}

        {/* Compress Button */}
        {file && (
          <button
            onClick={compressImage}
            disabled={loading || uploadProgress < 100}
            className={`w-full py-3 rounded font-semibold text-base md:text-lg transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 ${
              !loading && uploadProgress === 100
                ? "bg-blue-600 text-white hover:shadow-lg hover:scale-102"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Compressing...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Compress & Download</span>
              </>
            )}
          </button>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 md:h-6 bg-green-600 rounded-full"></span>
              Compression Complete
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Result Card */}
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Image Preview */}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Compressed Image
                  </p>
                  <div className="aspect-video rounded overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {(result.preview || result.data) && (
                      <Image
                        src={result.preview || result.data}
                        alt="Compressed"
                        width={400}
                        height={300}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-4">
                  <div className="bg-linear-to-br from-blue-50 to-pink-50 dark:from-blue-900/30 dark:to-pink-900/30 rounded p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Original Size
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatBytes(result.originalSize)}
                    </p>
                  </div>

                  <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Compressed Size
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatBytes(result.compressedSize)}
                    </p>
                  </div>

                  <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Space Saved
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {compressionRatio}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatBytes(result.originalSize - result.compressedSize)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex gap-3">
                <a
                  href={result.data}
                  download={result.name}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download
                </a>
                <button
                  onClick={clearAll}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Compress Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
