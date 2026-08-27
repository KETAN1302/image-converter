"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import {
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ArrowUturnRightIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface RotatedFile {
  name: string;
  data: string;
  preview?: string;
}

export default function RotateImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<RotatedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setRotation(0);

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

  const rotateImage = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("angle", String(rotation));
      formData.append("quality", String(quality));

      const response = await fetch("/api/rotate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to rotate image");
      }

      const blob = await response.blob();

      // Create preview data URL for result
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setResult({
          name: `rotated-${file.name}`,
          data,
          preview,
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error rotating image";
      setError(msg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const quickRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const clearAll = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError(null);
    setUploadProgress(0);
    setRotation(0);
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
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Image Rotator
            </h1>
            <p className="font-medium text-xs md:text-sm text-gray-950 dark:text-white">
              Rotate your images by any angle
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
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
        <div className="mb-4 md:mb-8">
          {/* Main Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
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
            <div className="text-center">
              <CloudArrowUpIcon
                aria-hidden="true"
                className={`w-12 h-12 md:w-20 md:h-20 mx-auto mb-2 md:mb-4 transition-all duration-300 ${
                  isDragging
                    ? "text-blue-500 scale-110"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              />
              <p className="text-base md:text-xl font-bold text-gray-950 dark:text-white mb-1 md:mb-2">
                {isDragging
                  ? "Drop here"
                  : isMobile
                    ? "Tap to upload"
                    : "Drag & drop here"}
              </p>
              <p className="text-xs md:text-sm font-medium text-gray-950 dark:text-white mb-3 md:mb-4">
                Supports: JPG, PNG, WebP, GIF (Max 50MB)
              </p>

              {/* Upload Button */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white text-sm md:text-base font-semibold rounded-xl active:bg-blue-700 hover:bg-blue-700 transition-colors shadow-md active:shadow-lg"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span>Select Image</span>
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload image to rotate"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Selected File Card */}
        {file && preview && (
          <div className="bg-white dark:bg-gray-900 rounded p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                  {preview && (
                    <Image
                      src={preview}
                      alt="Preview"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={{ transform: `rotate(${rotation}deg)` }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs font-medium text-gray-950 dark:text-white">
                    Rotation: {rotation}°
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

            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-3">
                Preview
              </label>
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-center min-h-64">
                {preview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full max-h-64 transition-transform duration-300"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                )}
              </div>
            </div>

            {/* Quick Rotate Buttons */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-3">
                Quick Actions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => quickRotate(90)}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded font-semibold text-xs md:text-sm transition-colors"
                >
                  Rotate 90°
                </button>
                <button
                  onClick={() => quickRotate(-90)}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded font-semibold text-xs md:text-sm transition-colors"
                >
                  Rotate -90°
                </button>
                <button
                  onClick={() => quickRotate(180)}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded font-semibold text-xs md:text-sm transition-colors"
                >
                  Rotate 180°
                </button>
                <button
                  onClick={() => setRotation(0)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-950 dark:text-white rounded font-semibold text-xs md:text-sm transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Custom Rotation Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="rotate-slider" className="text-sm font-semibold text-gray-950 dark:text-white">
                  Custom Rotation
                </label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {rotation}°
                </span>
              </div>
              <input
                id="rotate-slider"
                type="range"
                aria-label="Custom Rotation Angle in degrees"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Quality Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="rotate-quality" className="text-sm font-semibold text-gray-950 dark:text-white">
                  Quality
                </label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {quality}%
                </span>
              </div>
              <input
                id="rotate-quality"
                type="range"
                aria-label="Image Quality Adjustment"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Rotate Button */}
            <button
              onClick={rotateImage}
              disabled={loading}
              className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <ArrowUturnRightIcon aria-hidden="true" className="w-6 h-6" />
              {loading ? "Processing..." : "Rotate Image"}
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2 mb-4">
              <span className="w-1 h-5 md:h-6 bg-green-600 rounded-full"></span>
              Rotated Image
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
                      style={{ transform: `rotate(${rotation}deg)` }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                    {result.name}
                  </p>
                  <p className="text-xs font-medium text-gray-950 dark:text-white">
                    Rotated {rotation}°
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadImage}
                aria-label={`Download rotated image ${result.name}`}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={clearAll}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-950 dark:text-white font-semibold rounded transition-colors"
              >
                Rotate Another
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
