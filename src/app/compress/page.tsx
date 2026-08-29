"use client";

import { useState } from "react";
import Image from "next/image";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { LiaCompressArrowsAltSolid } from "react-icons/lia";

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
  const [result, setResult] = useState<CompressedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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

      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to compress image");
      }

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
      const msg =
        error instanceof Error ? error.message : "Error compressing image";
      setError(msg);
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="Image Compressor"
        subtitle="Reduce image file sizes with smart compression"
      />

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {error}
              </p>
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
            ariaLabel="Upload image to compress"
            subtitle="Supports: JPG, PNG, WebP, GIF (Max 50MB)"
          />
        )}

        {/* File Preview & Options */}
        {file && (
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                Compression Settings
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
                    {formatBytes(originalSize)}
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

            {/* Quality Presets */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-3">
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
                    className={`px-4 py-2 rounded font-semibold text-sm transition-all transform hover:scale-105 ${
                      quality === preset.value
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-950 dark:text-white"
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
                <label
                  htmlFor="compress-quality"
                  className="text-sm font-semibold text-gray-950 dark:text-white"
                >
                  Quality Adjustment
                </label>
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  {quality}%
                </span>
              </div>
              <input
                id="compress-quality"
                type="range"
                aria-label="Compression quality adjustment"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs font-medium text-gray-950 dark:text-white mt-2">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          </div>
        )}

        {/* Compress Button */}
        {file && (
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
              onClick={compressImage}
              disabled={loading || uploadProgress < 100}
              className={`flex-1 px-5 py-3 rounded-md font-bold text-base md:text-lg transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                !loading && uploadProgress === 100
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:scale-102"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compressing...</span>
                </>
              ) : (
                <>
                  <LiaCompressArrowsAltSolid aria-hidden="true" className="w-5 h-5" />
                  <span>Compress</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-950 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 md:h-6 bg-green-600 rounded-full"></span>
              Compression Complete
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Result Card */}
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Image Preview */}
                <div>
                  <p className="text-sm font-semibold text-gray-950 dark:text-white mb-3">
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
                    <p className="text-sm font-semibold text-gray-950 dark:text-white mb-1">
                      Original Size
                    </p>
                    <p className="text-2xl font-bold text-gray-950 dark:text-white">
                      {formatBytes(result.originalSize)}
                    </p>
                  </div>

                  <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white mb-1">
                      Compressed Size
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {formatBytes(result.compressedSize)}
                    </p>
                  </div>

                  <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white mb-1">
                      Space Saved
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {compressionRatio}%
                    </p>
                    <p className="text-xs font-medium text-gray-950 dark:text-white mt-1">
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
                  aria-label={`Download compressed image ${result.name}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                  Download
                </a>
                <button
                  onClick={clearAll}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
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
