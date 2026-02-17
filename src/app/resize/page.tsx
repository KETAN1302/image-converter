"use client";

import { useState, useRef } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Image from "next/image";
import {
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

interface ResizedFile {
  name: string;
  data: string;
  preview?: string;
}

export default function ResizeImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [keepAspect, setKeepAspect] = useState(true);
  const [quality, setQuality] = useState(80);
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ResizedFile | null>(null);
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
      const img = new window.Image();
      img.onload = () => {
        setOriginalDimensions({
          width: img.width,
          height: img.height,
        });
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = event.target?.result as string;
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

  const handleWidthChange = (value: number) => {
    setWidth(value);
    if (keepAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(value * ratio));
    }
  };

  const handleHeightChange = (value: number) => {
    setHeight(value);
    if (keepAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(value * ratio));
    }
  };

  const resizeImage = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("width", String(width));
      formData.append("height", String(height));
      formData.append("keepAspectRatio", String(keepAspect));
      formData.append("quality", String(quality));

      const response = await fetch("/API/resize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to resize image");

      const blob = await response.blob();

      // Create preview data URL for result
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setResult({
          name: `resized-${file.name}`,
          data,
          preview,
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      setError("Error resizing image");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const presetSizes = [
    { name: "Thumbnail", width: 200, height: 200 },
    { name: "Small", width: 400, height: 300 },
    { name: "Medium", width: 800, height: 600 },
    { name: "Large", width: 1280, height: 720 },
    { name: "Full HD", width: 1920, height: 1080 },
  ];

  const clearAll = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError(null);
    setUploadProgress(0);
    setWidth(800);
    setHeight(600);
  };

  const downloadImage = () => {
    if (!result?.data) return;
    const link = document.createElement("a");
    link.href = result.data;
    link.download = result.name;
    link.click();
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Image Resizer
          </h1>
          <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
            Resize your images to perfect dimensions
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
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
            className={`relative w-full p-6 md:p-8 border-3 border-dashed rounded-xl md:rounded-2xl transition-all duration-300 cursor-pointer ${
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
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
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-700 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                Resize Settings
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
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
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
                    {originalDimensions.width} × {originalDimensions.height}
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

            {/* Preset Sizes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {presetSizes.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setWidth(preset.width);
                      if (keepAspect && originalDimensions.width > 0) {
                        const ratio =
                          originalDimensions.height / originalDimensions.width;
                        setHeight(Math.round(preset.width * ratio));
                      } else {
                        setHeight(preset.height);
                      }
                    }}
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg font-medium text-xs md:text-sm transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Checkbox */}
            <div className="mb-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="keepAspect"
                checked={keepAspect}
                onChange={(e) => setKeepAspect(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label
                htmlFor="keepAspect"
                className="text-sm font-medium text-gray-700 dark:text-white cursor-pointer"
              >
                Keep aspect ratio
              </label>
            </div>

            {/* Dimension Controls */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quality Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-white">
                  Quality
                </label>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Resize Button */}
            <button
              onClick={resizeImage}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <AdjustmentsHorizontalIcon className="w-6 h-6" />
              {loading ? "Processing..." : "Resize Image"}
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-700 dark:text-white flex items-center gap-2 mb-4">
              <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
              Resized Image
            </h2>

            <div className="mb-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
                  {(result.preview || result.data) && (
                    <Image
                      src={result.preview || result.data}
                      alt={result.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-white truncate">
                    {result.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {width} × {height}px
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadImage}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={clearAll}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-semibold rounded-lg transition-colors"
              >
                Resize Another
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
