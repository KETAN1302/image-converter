"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  ArrowDownTrayIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface UpscaleResult {
  url: string;
  name: string;
  width: number;
  height: number;
  size: number;
}

export default function UpscalePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<UpscaleResult | null>(null);
  const [originalStats, setOriginalStats] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Settings
  const [scaleFactor, setScaleFactor] = useState<number>(2);
  const [isCustomScale, setIsCustomScale] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [sharpenAmount, setSharpenAmount] = useState<number>(40);

  // Split Comparison Slider state
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Status state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const comparisonContainerRef = useRef<HTMLDivElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [preview, result]);

  const handleFileSelected = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP, etc.).");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    // Clean old preview/result
    if (preview) URL.revokeObjectURL(preview);
    if (result?.url) URL.revokeObjectURL(result.url);

    setFile(selectedFile);
    setResult(null);
    setError(null);
    setUploadProgress(0);

    const objUrl = URL.createObjectURL(selectedFile);
    setPreview(objUrl);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 50);

    // Read original dimensions
    const img = document.createElement("img");
    img.onload = () => {
      setOriginalStats({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setCustomWidth(img.naturalWidth * 2);
      setCustomHeight(img.naturalHeight * 2);
    };
    img.src = objUrl;
  };

  const handleWidthChange = (val: number) => {
    setCustomWidth(val);
    if (keepAspectRatio && originalStats && originalStats.width > 0) {
      const ratio = originalStats.height / originalStats.width;
      setCustomHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setCustomHeight(val);
    if (keepAspectRatio && originalStats && originalStats.height > 0) {
      const ratio = originalStats.width / originalStats.height;
      setCustomWidth(Math.round(val * ratio));
    }
  };

  const clearAll = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview("");
    setResult(null);
    setOriginalStats(null);
    setError(null);
    setUploadProgress(0);
    setProgressPercent(0);
    setIsProcessing(false);
  };

  // Stepped Super-Resolution Upscaling Algorithm with Contrast-Adaptive Sharpening
  const processUpscale = async () => {
    if (!file || !preview || !originalStats) return;

    setIsProcessing(true);
    setProgressPercent(15);
    setError(null);

    try {
      let targetW = originalStats.width * scaleFactor;
      let targetH = originalStats.height * scaleFactor;

      if (isCustomScale) {
        targetW = Math.max(
          1,
          Math.min(16384, customWidth || originalStats.width),
        );
        targetH = Math.max(
          1,
          Math.min(16384, customHeight || originalStats.height),
        );
      }

      if (targetW * targetH > 64000000) {
        throw new Error(
          "Target dimensions exceed browser memory limit. Please select a smaller scale.",
        );
      }

      const img = document.createElement("img");
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load source image."));
        img.src = preview;
      });

      setProgressPercent(30);

      // Progressive multi-tier canvas stepped interpolation
      let currentCanvas = document.createElement("canvas");
      let currentCtx = currentCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!currentCtx) throw new Error("Could not initialize canvas.");

      currentCanvas.width = originalStats.width;
      currentCanvas.height = originalStats.height;
      currentCtx.drawImage(img, 0, 0);

      let currentW = originalStats.width;
      let currentH = originalStats.height;

      while (currentW < targetW || currentH < targetH) {
        const nextW = Math.min(targetW, Math.round(currentW * 1.75));
        const nextH = Math.min(targetH, Math.round(currentH * 1.75));

        const nextCanvas = document.createElement("canvas");
        const nextCtx = nextCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        if (!nextCtx) break;

        nextCanvas.width = nextW;
        nextCanvas.height = nextH;
        nextCtx.imageSmoothingEnabled = true;
        nextCtx.imageSmoothingQuality = "high";
        nextCtx.drawImage(currentCanvas, 0, 0, nextW, nextH);

        currentCanvas = nextCanvas;
        currentCtx = nextCtx;
        currentW = nextW;
        currentH = nextH;

        const p = Math.round(30 + (currentW / targetW) * 40);
        setProgressPercent(p);
      }

      setProgressPercent(75);

      // Contrast-Adaptive Sharpening convolution
      if (sharpenAmount > 0) {
        const imgData = currentCtx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;
        const width = targetW;
        const height = targetH;
        const copy = new Uint8ClampedArray(data);
        const sharpenFactor = (sharpenAmount / 100) * 0.85;

        for (let y = 1; y < height - 1; y++) {
          const rowOffset = y * width;
          const prevRowOffset = (y - 1) * width;
          const nextRowOffset = (y + 1) * width;

          for (let x = 1; x < width - 1; x++) {
            const idx = (rowOffset + x) * 4;

            for (let c = 0; c < 3; c++) {
              const center = copy[idx + c];
              const top = copy[(prevRowOffset + x) * 4 + c];
              const bottom = copy[(nextRowOffset + x) * 4 + c];
              const left = copy[(rowOffset + (x - 1)) * 4 + c];
              const right = copy[(rowOffset + (x + 1)) * 4 + c];

              const laplacian = 4 * center - top - bottom - left - right;
              const sharpened = center + laplacian * sharpenFactor;
              data[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
            }
          }
        }
        currentCtx.putImageData(imgData, 0, 0);
      }

      setProgressPercent(95);

      const blob = await new Promise<Blob | null>((resolve) => {
        currentCanvas.toBlob((b) => resolve(b), "image/png");
      });

      if (!blob) throw new Error("Failed to export upscaled image.");

      if (result?.url) URL.revokeObjectURL(result.url);
      const resUrl = URL.createObjectURL(blob);

      const nameParts = file.name.split(".");
      const ext = nameParts.length > 1 ? nameParts.pop() : "png";
      const baseName = nameParts.join(".");
      const outputName = `${baseName}_upscaled_${targetW}x${targetH}.${ext === "png" ? "png" : "png"}`;

      setResult({
        url: resUrl,
        name: outputName,
        width: targetW,
        height: targetH,
        size: blob.size,
      });

      setProgressPercent(100);
    } catch (err: unknown) {
      console.error("Upscale error:", err);
      setError(err instanceof Error ? err.message : "Failed to upscale image.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Slider dragging handlers
  const handleSliderMove = useCallback((clientX: number) => {
    if (!comparisonContainerRef.current) return;
    const rect = comparisonContainerRef.current.getBoundingClientRect();
    const pos = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
    setSliderPosition(pos);
  }, []);

  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleTouchStart = () => setIsDraggingSlider(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSlider(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) handleSliderMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches.length > 0) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    if (isDraggingSlider) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDraggingSlider, handleSliderMove]);

  const downloadImage = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const pixelIncrease =
    originalStats && result
      ? Math.round(
          ((result.width * result.height) /
            Math.max(1, originalStats.width * originalStats.height) -
            1) *
            100,
        )
      : 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="AI Image Upscaler"
        subtitle="Enlarge & enhance resolution with smart super-resolution"
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
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-1 cursor-pointer"
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
              if (files[0]) handleFileSelected(files[0]);
            }}
            accept="image/*"
            ariaLabel="Upload image to upscale"
            subtitle="Supports: JPG, PNG, WebP, GIF, BMP (Max 50MB)"
          />
        )}

        {/* File Preview & Options */}
        {file && (
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                Upscale Settings
              </h2>
              <button
                onClick={clearAll}
                className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold transition-colors cursor-pointer"
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
                    {originalStats
                      ? `${originalStats.width} × ${originalStats.height}px • `
                      : ""}
                    {formatBytes(file.size)}
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

            {/* Scale Presets */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-3">
                Scale Factor
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "2x (Recommended)", value: 2 },
                  { label: "4x (High Def)", value: 4 },
                  { label: "8x (Ultra HD)", value: 8 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setScaleFactor(preset.value);
                      setIsCustomScale(false);
                      if (originalStats) {
                        setCustomWidth(originalStats.width * preset.value);
                        setCustomHeight(originalStats.height * preset.value);
                      }
                    }}
                    className={`px-4 py-2 rounded font-semibold text-sm transition-all transform hover:scale-105 cursor-pointer ${
                      !isCustomScale && scaleFactor === preset.value
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-950 dark:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomScale(true)}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-all transform hover:scale-105 cursor-pointer ${
                    isCustomScale
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-950 dark:text-white"
                  }`}
                >
                  Custom Dimensions
                </button>
              </div>
            </div>

            {/* Custom Dimensions if enabled */}
            {isCustomScale && (
              <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded p-4">
                <label className="block text-sm font-semibold text-gray-950 dark:text-white mb-3">
                  Target Dimensions (px)
                </label>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-950 dark:text-white mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="16384"
                      value={customWidth}
                      onChange={(e) =>
                        handleWidthChange(parseInt(e.target.value) || 0)
                      }
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white rounded p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-950 dark:text-white mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="16384"
                      value={customHeight}
                      onChange={(e) =>
                        handleHeightChange(parseInt(e.target.value) || 0)
                      }
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white rounded p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-950 dark:text-white cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={keepAspectRatio}
                    onChange={(e) => setKeepAspectRatio(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Maintain aspect ratio
                </label>
              </div>
            )}

            {/* Sharpening Slider */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-950 dark:text-white">
                  Edge Detail Sharpening
                </label>
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  {sharpenAmount}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sharpenAmount}
                onChange={(e) => setSharpenAmount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs font-medium text-gray-950 dark:text-white mt-2">
                <span>Softer edges</span>
                <span>Maximum sharpness</span>
              </div>
            </div>

            {/* Target Output Dimension Info */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-medium text-gray-950 dark:text-white">
              <span>Target Resolution:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {isCustomScale
                  ? `${customWidth} × ${customHeight} px`
                  : `${(originalStats?.width || 0) * scaleFactor} × ${(originalStats?.height || 0) * scaleFactor} px`}
              </span>
            </div>
          </div>
        )}

        {/* Upscale Button */}
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
              onClick={processUpscale}
              disabled={isProcessing || uploadProgress < 100}
              className={`flex-1 px-5 py-3 rounded-md font-bold text-base md:text-lg transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                !isProcessing && uploadProgress === 100
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:scale-102"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Upscaling Image... {progressPercent}%</span>
                </>
              ) : (
                <>
                  <SparklesIcon aria-hidden="true" className="w-5 h-5" />
                  <span>
                    Upscale Image{" "}
                    {isCustomScale
                      ? `${customWidth}×${customHeight}`
                      : `${scaleFactor}x`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-950 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 md:h-6 bg-green-600 rounded-full"></span>
              Upscaling Complete
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Result Card */}
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Interactive Split Comparison Slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white">
                      Interactive Comparison
                    </p>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Drag handle left / right
                    </span>
                  </div>

                  <div
                    ref={comparisonContainerRef}
                    className="relative w-full aspect-video rounded overflow-hidden border border-gray-200 dark:border-gray-700 select-none bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-ew-resize"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                  >
                    {/* Upscaled Background Layer */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.url}
                      alt="Upscaled result"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* Original Foreground Layer (Clipped) */}
                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Original source"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{
                          width: comparisonContainerRef.current?.clientWidth
                            ? `${comparisonContainerRef.current.clientWidth}px`
                            : "100%",
                          maxWidth: "none",
                        }}
                      />
                    </div>

                    {/* Divider Line & Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] z-20 pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-600 shadow-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                        ↔
                      </div>
                    </div>

                    {/* Floating Labels */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded pointer-events-none z-10">
                      Original
                    </div>
                    <div className="absolute top-2 right-2 bg-blue-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded pointer-events-none z-10">
                      Upscaled
                    </div>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="space-y-4">
                  <div className="bg-linear-to-br from-blue-50 to-pink-50 dark:from-blue-900/30 dark:to-pink-900/30 rounded p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white mb-1">
                      Original Resolution
                    </p>
                    <p className="text-2xl font-bold text-gray-950 dark:text-white">
                      {originalStats?.width} × {originalStats?.height} px
                    </p>
                    <p className="text-xs font-medium text-gray-950 dark:text-white mt-1">
                      {formatBytes(file?.size || 0)}
                    </p>
                  </div>

                  <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white mb-1">
                      Upscaled Resolution
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {result.width} × {result.height} px
                    </p>
                    <p className="text-xs font-medium text-gray-950 dark:text-white mt-1">
                      {formatBytes(result.size)}
                    </p>
                  </div>

                  <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white mb-1">
                      Resolution Boost
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      +{pixelIncrease}%
                    </p>
                    <p className="text-xs font-medium text-gray-950 dark:text-white mt-1">
                      Total{" "}
                      {((result.width * result.height) / 1000000).toFixed(1)}{" "}
                      Megapixels
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex gap-3">
                <button
                  onClick={downloadImage}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold shadow-md cursor-pointer"
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={clearAll}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-950 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold cursor-pointer"
                >
                  Upscale Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
