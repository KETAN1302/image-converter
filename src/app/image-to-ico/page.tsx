"use client";

import { useState } from "react";
import Image from "next/image";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  ArrowDownTrayIcon,
  Squares2X2Icon,
  PaintBrushIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48]);
  const [bitDepth] = useState<32>(32);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const sizeOptions = [16, 32, 48, 64, 128, 256];

  const processFile = (uploadedFile: File) => {
    if (!uploadedFile.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }

    if (uploadedFile.size > 4 * 1024 * 1024) {
      setError("File size must be less than 4MB");
      return;
    }

    setError(null);
    setFile(uploadedFile);

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

  const handleSizeToggle = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => a - b),
    );
  };

  const handleSelectAll = () => {
    setSelectedSizes([...sizeOptions]);
  };

  const handleClearAll = () => {
    setSelectedSizes([]);
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadProgress(0);
    setSelectedSizes([16, 32, 48]);
    setLoading(false);
  };

  const handleConvert = async () => {
    if (!file || selectedSizes.length === 0) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sizes", JSON.stringify(selectedSizes));
    formData.append("bitDepth", bitDepth.toString());

    try {
      const res = await fetch("/api/ico", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Conversion failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `icon_${selectedSizes.join("x")}_${bitDepth}bit.ico`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Conversion error:", error);
      const msg = error instanceof Error ? error.message : "Failed to convert image. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="Image to ICO Converter"
        subtitle="Convert your images to Windows icon format"
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
            accept="image/png,image/jpeg,image/gif,image/bmp"
            ariaLabel="Upload image to convert to ICO"
            subtitle="Supports: PNG, JPEG, GIF, BMP (Max 4MB)"
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Preview & File Info */}
          {file && preview && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                    <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                    Image Preview
                  </h2>
                  <button
                    onClick={clearAll}
                    className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* File Info */}
                <div className="mb-4">
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
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      {uploadProgress < 100 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-blue-600 to-blue-600 transition-all duration-300"
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
              </div>

              {/* Bit Depth Section */}
              <div className="bg-linear-to-br from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded p-4 md:p-6 border border-blue-100 dark:border-blue-800">
                <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white mb-3 flex items-center gap-2">
                  <PaintBrushIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Color Depth
                </h2>
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded p-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    <span className="font-bold text-blue-800 dark:text-blue-300">
                      32-bit (recommended)
                    </span>{" "}
                    - Supports transparency and 16.7 millions of colors
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Size Selection */}
          {file && (
            <div className="bg-white dark:bg-gray-900 rounded shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                  <Squares2X2Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Icon Sizes
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/60 font-semibold transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <p className="text-xs font-medium text-gray-950 dark:text-white mb-4 flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                A single ICO file can store multiple resolutions
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {sizeOptions.map((size) => {
                  const sizeLabels: Record<number, string> = {
                    16: "Favicon",
                    32: "Browser tab",
                    48: "Desktop shortcut",
                    64: "High DPI icon",
                    128: "Large preview",
                    256: "Extra large icon",
                  };
                  return (
                    <label
                      key={size}
                      className={`relative flex items-center p-2.5 border rounded cursor-pointer transition-all ${
                        selectedSizes.includes(size)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                          : "border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Include ${size}x${size} pixel icon size`}
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleSizeToggle(size)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-3"
                      />
                      <div>
                        <span className="text-sm font-bold block text-gray-950 dark:text-white">
                          {size}px
                        </span>
                        <span className="text-xs font-medium text-gray-950 dark:text-white">
                          {sizeLabels[size] || "Standard"}
                        </span>
                      </div>
                      {selectedSizes.includes(size) && (
                        <div className="absolute top-2 right-2">
                          <svg
                            aria-hidden="true"
                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {selectedSizes.length === 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 mb-4">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Please select at least one size
                  </p>
                </div>
              )}

              {selectedSizes.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2 mb-4">
                  <p className="text-sm text-green-700 dark:text-green-400 font-bold">
                    ✓ {selectedSizes.length} size
                    {selectedSizes.length > 1 ? "s" : ""} selected
                  </p>
                </div>
              )}

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
                  onClick={handleConvert}
                  disabled={!file || selectedSizes.length === 0 || loading}
                  className="flex-1 bg-linear-to-r from-blue-600 to-blue-600 text-white py-3 px-5 rounded-md font-bold hover:from-blue-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-base md:text-lg flex items-center justify-center gap-3 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg
                        aria-hidden="true"
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                      Convert
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
