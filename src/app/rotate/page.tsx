"use client";

import { useState } from "react";
import Image from "next/image";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  ArrowDownTrayIcon,
  ArrowUturnRightIcon,
  ExclamationCircleIcon,
  XMarkIcon,
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
  const [result, setResult] = useState<RotatedFile | null>(null);
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

  const rotateImageClientSide = async (
    sourceFile: File,
    degrees: number,
    targetQuality: number
  ): Promise<{ dataUrl: string; blob: Blob }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(sourceFile);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        if (!w || !h) {
          reject(new Error("Invalid image dimensions"));
          return;
        }

        const rad = (degrees * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const newWidth = Math.max(1, Math.round(w * cos + h * sin));
        const newHeight = Math.max(1, Math.round(w * sin + h * cos));

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Could not initialize canvas context"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const fileType = sourceFile.type.toLowerCase();
        let mimeType = "image/jpeg";
        if (fileType.includes("png")) {
          mimeType = "image/png";
        } else if (fileType.includes("webp")) {
          mimeType = "image/webp";
        }

        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, newWidth, newHeight);
        }

        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -w / 2, -h / 2);

        const q = Math.max(0.1, Math.min(1.0, targetQuality / 100));

        try {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const dataUrl = e.target?.result as string;
                  resolve({ dataUrl, blob });
                };
                reader.onerror = () => reject(new Error("Failed to read rotated blob"));
                reader.readAsDataURL(blob);
              } else {
                const dataUrl = canvas.toDataURL(mimeType, q);
                const bin = atob(dataUrl.split(",")[1]);
                const arr = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) {
                  arr[i] = bin.charCodeAt(i);
                }
                const fallbackBlob = new Blob([arr], { type: mimeType });
                resolve({ dataUrl, blob: fallbackBlob });
              }
            },
            mimeType,
            q
          );
        } catch {
          const dataUrl = canvas.toDataURL(mimeType, q);
          const bin = atob(dataUrl.split(",")[1]);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) {
            arr[i] = bin.charCodeAt(i);
          }
          const fallbackBlob = new Blob([arr], { type: mimeType });
          resolve({ dataUrl, blob: fallbackBlob });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load source image into canvas"));
      };

      img.src = objectUrl;
    });
  };

  const rotateImage = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Client-side canvas rotation (instant, handles files of any size without Vercel limits)
      const clientResult = await rotateImageClientSide(file, rotation, quality);
      setResult({
        name: `rotated-${file.name}`,
        data: clientResult.dataUrl,
        preview,
      });
    } catch (clientErr) {
      console.warn("Client rotation failed, falling back to server API:", clientErr);
      // 2. Server API fallback
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
          const rawText = await response.text().catch(() => "");
          let errorMsg = "Failed to rotate image";
          try {
            const parsed = JSON.parse(rawText);
            if (parsed?.error) errorMsg = parsed.error;
          } catch {
            if (response.status === 413) {
              errorMsg = "File size exceeds server upload limit.";
            }
          }
          throw new Error(errorMsg);
        }

        const blob = await response.blob();
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
      } catch (apiErr) {
        const msg = apiErr instanceof Error ? apiErr.message : "Error rotating image";
        setError(msg);
      }
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
      <ToolHeader
        title="Image Rotator"
        subtitle="Rotate your images by any angle"
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
            ariaLabel="Upload image to rotate"
            subtitle="Supports: JPG, PNG, WebP, GIF (Max 50MB)"
          />
        )}

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={rotateImage}
                disabled={loading}
                className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-md transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm md:text-base"
              >
                <ArrowUturnRightIcon aria-hidden="true" className="w-6 h-6" />
                <span>{loading ? "Processing..." : "Rotate Image"}</span>
              </button>
            </div>
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
