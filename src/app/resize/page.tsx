"use client";

import { useState } from "react";
import Image from "next/image";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ResizedFile {
  name: string;
  data: string;
  preview?: string;
  width?: number;
  height?: number;
  size?: number;
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
  const [result, setResult] = useState<ResizedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleWidthChange = (value: number) => {
    const validValue = isNaN(value) ? 0 : value;
    setWidth(validValue);
    if (keepAspect && originalDimensions.width > 0 && validValue > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(validValue * ratio));
    }
  };

  const handleHeightChange = (value: number) => {
    const validValue = isNaN(value) ? 0 : value;
    setHeight(validValue);
    if (keepAspect && originalDimensions.height > 0 && validValue > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(validValue * ratio));
    }
  };

  const resizeImage = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }

    if (width <= 0 || height <= 0) {
      setError("Please enter valid width and height dimensions greater than 0");
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

      const response = await fetch("/api/resize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to resize image");
      }

      const blob = await response.blob();

      // Create preview data URL for result and read actual dimensions
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          setResult({
            name: `resized-${file.name}`,
            data,
            preview,
            width: img.width,
            height: img.height,
            size: blob.size,
          });
        };
        img.src = data;
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error resizing image";
      setError(msg);
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="Image Resizer"
        subtitle="Resize your images to perfect dimensions"
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
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!file && (
          <Dropzone
            onFilesSelected={(files) => {
              if (files[0]) processFile(files[0]);
            }}
            accept="image/*"
            ariaLabel="Upload image to resize"
            subtitle="Supports: JPG, PNG, WebP, GIF (Max 50MB)"
          />
        )}

        {/* File Preview & Options */}
        {file && (
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                Resize Settings
              </h2>
              <button
                onClick={clearAll}
                className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold transition-colors"
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
                  <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs font-medium text-gray-950 dark:text-white">
                    {originalDimensions.width} × {originalDimensions.height}px
                  </p>
                  {uploadProgress < 100 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-950 dark:text-white">
                        {uploadProgress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preset Sizes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-3">
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
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded font-semibold text-xs md:text-sm transition-colors"
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
                className="text-sm font-semibold text-gray-950 dark:text-white cursor-pointer"
              >
                Keep aspect ratio
              </label>
            </div>

            {/* Dimension Controls */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="resize-width" className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Width (px)
                </label>
                <input
                  id="resize-width"
                  type="number"
                  aria-label="Target width in pixels"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="resize-height" className="block text-sm font-semibold text-gray-950 dark:text-white mb-2">
                  Height (px)
                </label>
                <input
                  id="resize-height"
                  type="number"
                  aria-label="Target height in pixels"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quality Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="resize-quality" className="text-sm font-semibold text-gray-950 dark:text-white">
                  Quality
                </label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {quality}%
                </span>
              </div>
              <input
                id="resize-quality"
                type="range"
                aria-label="Resize quality adjustment"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 px-5 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-md transition-all active:scale-98 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 cursor-pointer shadow-sm text-sm md:text-base"
              >
                <XMarkIcon aria-hidden="true" className="w-5 h-5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={resizeImage}
                disabled={loading}
                className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-md transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm md:text-base"
              >
                <AdjustmentsHorizontalIcon aria-hidden="true" className="w-6 h-6" />
                <span>{loading ? "Processing..." : "Resize Image"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2 mb-4">
              <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
              Resized Image
            </h2>

            <div className="mb-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
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
                  <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                    {result.name}
                  </p>
                  <p className="text-xs font-medium text-gray-950 dark:text-white">
                    {result.width || width} × {result.height || height}px {result.size ? `• ${(result.size / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadImage}
                aria-label={`Download resized image ${result.name}`}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={clearAll}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-950 dark:text-white font-semibold rounded transition-colors"
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
