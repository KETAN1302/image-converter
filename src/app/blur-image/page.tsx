"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  EyeSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type CensorshipStyle = "blur" | "pixelate" | "blackout";

interface BlurRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: CensorshipStyle;
  blurRadius: number;
  blockSize: number;
}

export default function BlurImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Tool settings
  const [censorStyle, setCensorStyle] = useState<CensorshipStyle>("blur");
  const [blurIntensity, setBlurIntensity] = useState<number>(25);
  const [pixelBlockSize, setPixelBlockSize] = useState<number>(16);

  // Regions & History
  const [regions, setRegions] = useState<BlurRegion[]>([]);
  const [history, setHistory] = useState<BlurRegion[][]>([]);

  // Canvas interaction
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentBox, setCurrentBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Status state
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileSelected = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP, etc.).");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setFile(selectedFile);
    setRegions([]);
    setHistory([]);
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

    const img = document.createElement("img");
    img.onload = () => {
      setOriginalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      imgElementRef.current = img;
    };
    img.src = objUrl;
  };

  const clearAll = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setRegions([]);
    setHistory([]);
    setOriginalDimensions(null);
    setError(null);
    setUploadProgress(0);
  };

  // Render canvas with all active blur/pixelate/blackout regions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgElementRef.current;
    if (!canvas || !img || !originalDimensions) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = originalDimensions.width;
    canvas.height = originalDimensions.height;

    // Draw base original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Apply each censorship region
    regions.forEach((region) => {
      ctx.save();

      const { x, y, width, height, style, blurRadius, blockSize } = region;
      if (width <= 0 || height <= 0) {
        ctx.restore();
        return;
      }

      if (style === "blackout") {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(x, y, width, height);
      } else if (style === "blur") {
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.drawImage(img, 0, 0);
      } else if (style === "pixelate") {
        const bSize = Math.max(4, blockSize);
        const scaledW = Math.max(1, Math.floor(width / bSize));
        const scaledH = Math.max(1, Math.floor(height / bSize));

        const offCanvas = document.createElement("canvas");
        offCanvas.width = scaledW;
        offCanvas.height = scaledH;
        const offCtx = offCanvas.getContext("2d");

        if (offCtx) {
          offCtx.imageSmoothingEnabled = true;
          offCtx.drawImage(img, x, y, width, height, 0, 0, scaledW, scaledH);

          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(offCanvas, 0, 0, scaledW, scaledH, x, y, width, height);
        }
      }

      ctx.restore();
    });

    // Draw active drawing box outline
    if (currentBox) {
      ctx.save();
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
      ctx.fillStyle = "rgba(37, 99, 235, 0.2)";
      ctx.fillRect(currentBox.x, currentBox.y, currentBox.w, currentBox.h);
      ctx.restore();
    }
  }, [originalDimensions, regions, currentBox]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Canvas Mouse / Touch Coordinates Calculator
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !originalDimensions) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = originalDimensions.width / rect.width;
    const scaleY = originalDimensions.height / rect.height;

    const x = Math.max(
      0,
      Math.min(originalDimensions.width, (clientX - rect.left) * scaleX),
    );
    const y = Math.max(
      0,
      Math.min(originalDimensions.height, (clientY - rect.top) * scaleY),
    );

    return { x, y };
  };

  // Pointer Down
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!originalDimensions) return;
    const { x, y } = getCanvasCoords(clientX, clientY);
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  // Pointer Move
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDrawing || !startPoint || !originalDimensions) return;
    const { x, y } = getCanvasCoords(clientX, clientY);

    const boxX = Math.min(startPoint.x, x);
    const boxY = Math.min(startPoint.y, y);
    const boxW = Math.abs(x - startPoint.x);
    const boxH = Math.abs(y - startPoint.y);
    setCurrentBox({ x: boxX, y: boxY, w: boxW, h: boxH });
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentBox && currentBox.w > 10 && currentBox.h > 10) {
      const newRegion: BlurRegion = {
        id: "region-" + Date.now(),
        x: Math.round(currentBox.x),
        y: Math.round(currentBox.y),
        width: Math.round(currentBox.w),
        height: Math.round(currentBox.h),
        style: censorStyle,
        blurRadius: blurIntensity,
        blockSize: pixelBlockSize,
      };

      setHistory((prev) => [...prev, regions]);
      setRegions((prev) => [...prev, newRegion]);
    }

    setStartPoint(null);
    setCurrentBox(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRegions(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const removeRegion = (id: string) => {
    setHistory((prev) => [...prev, regions]);
    setRegions((prev) => prev.filter((r) => r.id !== id));
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;

    const dataUrl = canvas.toDataURL("image/png");
    const nameParts = file.name.split(".");
    nameParts.pop();
    const baseName = nameParts.join(".");
    const downloadName = `${baseName}_blurred.png`;

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = downloadName;
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="Blur & Censor Image"
        subtitle="Censor faces, license plates, text, and confidential areas"
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

        {/* Upload Section Dropzone */}
        {!file && (
          <Dropzone
            onFilesSelected={(files) => {
              if (files[0]) handleFileSelected(files[0]);
            }}
            accept="image/*"
            ariaLabel="Upload image to blur or censor"
            subtitle="Supports: JPG, PNG, WebP, GIF, BMP (Max 50MB)"
          />
        )}

        {/* Editor & Studio when file is loaded */}
        {file && (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                  Censor & Blur Settings
                </h2>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={handleUndo}
                      title="Undo last action"
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                      Undo
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* File Info */}
              <div className="flex items-center gap-4 p-3.5 bg-gray-50 dark:bg-gray-800 rounded-md mb-5">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
                  {preview && (
                    <Image
                      src={preview}
                      alt={file.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs font-medium text-gray-950 dark:text-white">
                    {originalDimensions
                      ? `${originalDimensions.width} × ${originalDimensions.height}px • `
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
                <div className="text-right">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                    {regions.length} blurred area
                    {regions.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Censorship Style Selection */}
              <div className="mb-5">
                <label className="block text-xs md:text-sm font-bold text-gray-950 dark:text-white mb-2">
                  Censorship Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "blur",
                      label: "Gaussian Blur",
                      desc: "Smooth frosted privacy blur",
                    },
                    {
                      id: "pixelate",
                      label: "Pixelate / Mosaic",
                      desc: "Classic 8-bit censor blocks",
                    },
                    {
                      id: "blackout",
                      label: "Blackout Box",
                      desc: "Solid black document redaction",
                    },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setCensorStyle(style.id as CensorshipStyle)
                      }
                      className={`p-2.5 text-center rounded-md border transition-all cursor-pointer ${
                        censorStyle === style.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-950 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="text-xs md:text-sm font-bold">
                        {style.label}
                      </div>
                      <div className="text-[11px] opacity-75 font-medium mt-0.5">
                        {style.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for Blur or Pixelation Strength */}
              {censorStyle !== "blackout" && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3.5">
                  {censorStyle === "blur" && (
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs md:text-sm font-bold text-gray-950 dark:text-white">
                        <span>Blur Intensity</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {blurIntensity}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        value={blurIntensity}
                        onChange={(e) =>
                          setBlurIntensity(parseInt(e.target.value))
                        }
                        className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  )}

                  {censorStyle === "pixelate" && (
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs md:text-sm font-bold text-gray-950 dark:text-white">
                        <span>Mosaic Block Size</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {pixelBlockSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="40"
                        value={pixelBlockSize}
                        onChange={(e) =>
                          setPixelBlockSize(parseInt(e.target.value))
                        }
                        className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Canvas Studio */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <EyeSlashIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-sm md:text-base text-gray-950 dark:text-white">
                    Interactive Privacy Canvas
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Click & drag anywhere over faces, license plates, or text
                  to blur
                </p>
              </div>

              {/* Canvas viewport */}
              <div className="relative w-full rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center select-none touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                  onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                  onMouseUp={handlePointerUp}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      handlePointerDown(
                        e.touches[0].clientX,
                        e.touches[0].clientY,
                      );
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length > 0) {
                      handlePointerMove(
                        e.touches[0].clientX,
                        e.touches[0].clientY,
                      );
                    }
                  }}
                  onTouchEnd={handlePointerUp}
                  className="max-h-[600px] w-auto h-auto max-w-full object-contain cursor-crosshair"
                />
              </div>

              {/* Active Regions Quick List */}
              {regions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-950 dark:text-white">
                    Active Censor Areas:
                  </span>
                  {regions.map((reg, idx) => (
                    <div
                      key={reg.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white border border-gray-200 dark:border-gray-700"
                    >
                      <span>
                        #{idx + 1} ({reg.style})
                      </span>
                      <button
                        onClick={() => removeRegion(reg.id)}
                        className="hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete this blur box"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Download and Action Bar */}
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
                onClick={downloadImage}
                className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-md active:scale-99 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
              >
                <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
