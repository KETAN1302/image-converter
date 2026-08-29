"use client";

import { useState, useEffect } from "react";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  ArrowDownTrayIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  PaintBrushIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function RemoveBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Background Replacement Settings
  const [bgType, setBgType] = useState<"transparent" | "color" | "gradient">(
    "transparent",
  );
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [bgGradient, setBgGradient] = useState<string>(
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  );
  const [showOriginalComparison, setShowOriginalComparison] =
    useState<boolean>(false);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (processedUrl) URL.revokeObjectURL(processedUrl);
      if (compositeUrl) URL.revokeObjectURL(compositeUrl);
    };
  }, [processedUrl, compositeUrl]);

  const handleFileSelected = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("Image size exceeds 25MB. Please choose a smaller image.");
      return;
    }

    setError(null);
    setFile(selectedFile);
    setProcessedUrl(null);
    setCompositeUrl(null);
    setProgressPercent(0);
    setProgressStatus("");

    const preview = URL.createObjectURL(selectedFile);
    setOriginalPreview(preview);
  };

  // Normalize input image (converts AVIF, WebP, SVG, BMP, etc. to standard PNG Blob)
  const prepareImageForSegmentation = async (
    sourceFile: File,
    previewUrl: string,
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            resolve(sourceFile);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(sourceFile);
            }
          }, "image/png");
        } catch {
          resolve(sourceFile);
        }
      };
      img.onerror = () => {
        // If <img> fails to load directly, fallback to passing sourceFile
        resolve(sourceFile);
      };
      img.src = previewUrl;
    });
  };

  // Perform AI Background Removal
  const handleRemoveBackground = async () => {
    if (!file || !originalPreview) return;

    setIsProcessing(true);
    setError(null);
    setProgressPercent(5);
    try {
      setProgressStatus("Preparing image format...");
      const inputBlob = await prepareImageForSegmentation(file, originalPreview);

      // Dynamically import @imgly/background-removal on the client side
      const { removeBackground } = await import("@imgly/background-removal");

      setProgressStatus("Downloading AI model & segmenting subject...");
      const blob = await removeBackground(inputBlob, {
        publicPath:
          "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
        output: {
          format: "image/png",
          quality: 1.0,
        },
        debug: false,
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            setProgressPercent(pct);
            if (key.includes("fetch")) {
              setProgressStatus(`Loading AI neural network... ${pct}%`);
            } else if (key.includes("compute")) {
              setProgressStatus(`Extracting foreground subject... ${pct}%`);
            } else {
              setProgressStatus(`Processing image... ${pct}%`);
            }
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
      setProgressPercent(100);
      setProgressStatus("Background removed successfully!");
    } catch (err: unknown) {
      console.error("Background removal error:", err);
      const message =
        err instanceof Error
          ? err.message || err.toString()
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err) || "Unknown error occurred";

      setError(
        `Background removal failed: ${message}. Please verify your internet connection (to download the AI model on first run) and WebAssembly browser support.`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Render composite to Canvas for download with custom background
  useEffect(() => {
    if (!processedUrl) return;

    const renderComposite = async () => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = processedUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (bgType === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgType === "gradient") {
        // Parse gradient or create simple linear gradient
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        if (bgGradient.includes("#667eea")) {
          gradient.addColorStop(0, "#667eea");
          gradient.addColorStop(1, "#764ba2");
        } else if (bgGradient.includes("#ff9a9e")) {
          gradient.addColorStop(0, "#ff9a9e");
          gradient.addColorStop(1, "#fecfef");
        } else if (bgGradient.includes("#fbc2eb")) {
          gradient.addColorStop(0, "#fbc2eb");
          gradient.addColorStop(1, "#a6c1ee");
        } else if (bgGradient.includes("#84fab0")) {
          gradient.addColorStop(0, "#84fab0");
          gradient.addColorStop(1, "#8fd3f4");
        } else if (bgGradient.includes("#232526")) {
          gradient.addColorStop(0, "#232526");
          gradient.addColorStop(1, "#414345");
        } else {
          gradient.addColorStop(0, "#3b82f6");
          gradient.addColorStop(1, "#9333ea");
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setCompositeUrl((prevUrl) => {
            if (prevUrl) URL.revokeObjectURL(prevUrl);
            return URL.createObjectURL(blob);
          });
        }
      }, "image/png");
    };

    renderComposite().catch(console.error);
  }, [processedUrl, bgType, bgColor, bgGradient]);

  const handleDownload = () => {
    const downloadUrl = bgType === "transparent" ? processedUrl : compositeUrl;
    if (!downloadUrl || !file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${baseName}-no-bg.png`;
    link.click();
  };

  const handleClear = () => {
    setFile(null);
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    if (compositeUrl) URL.revokeObjectURL(compositeUrl);
    setOriginalPreview(null);
    setProcessedUrl(null);
    setCompositeUrl(null);
    setError(null);
    setProgressPercent(0);
    setProgressStatus("");
    setBgType("transparent");
  };

  const gradientPresets = [
    {
      name: "Oceanic",
      value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      name: "Sunset Rose",
      value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    },
    {
      name: "Pastel Sky",
      value: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    },
    {
      name: "Mint Fresh",
      value: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    },
    {
      name: "Midnight Dark",
      value: "linear-gradient(135deg, #232526 0%, #414345 100%)",
    },
    {
      name: "Electric Violet",
      value: "linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)",
    },
  ];

  const solidColorPresets = [
    { name: "White", value: "#ffffff" },
    { name: "Black", value: "#000000" },
    { name: "Slate", value: "#64748b" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Purple", value: "#a855f7" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="Remove Background"
        subtitle="Remove background with AI — 100% free & private in your browser"
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

        {/* Upload Drop Zone */}
        {!file && (
          <Dropzone
            onFilesSelected={(files) => {
              if (files[0]) handleFileSelected(files[0]);
            }}
            accept="image/*"
            buttonIcon={<SparklesIcon className="w-4 h-4 md:w-5 md:h-5" />}
            ariaLabel="Select image for background removal"
            subtitle="Supports: PNG, JPG, JPEG, WebP, AVIF, GIF (Max 25MB)"
          />
        )}

        {/* Processing State / Preview Studio */}
        {file && (
          <div className="space-y-6">
            {/* Action Bar / Status */}
            <div className="p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    {processedUrl ? "Background Removed" : "Image Selected"}
                  </h2>
                  <p className="text-xs font-medium text-gray-950 dark:text-white mt-0.5">
                    {file.name} • {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {processedUrl && (
                    <button
                      onClick={() =>
                        setShowOriginalComparison(!showOriginalComparison)
                      }
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-xs md:text-sm font-semibold text-gray-950 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                    >
                      <EyeIcon className="w-4 h-4" />
                      {showOriginalComparison
                        ? "Hide Original"
                        : "Compare Original"}
                    </button>
                  )}
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Progress Bar during AI execution */}
              {isProcessing && (
                <div className="mt-4 pt-2">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-950 dark:text-white mb-2">
                    <span>{progressStatus}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(progressPercent, 8)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Trigger Button if not processed yet */}
              {!processedUrl && !isProcessing && (
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 px-5 py-3 md:py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-md transition-all active:scale-98 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 cursor-pointer shadow-sm text-sm md:text-base"
                  >
                    <XMarkIcon aria-hidden="true" className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleRemoveBackground}
                    className="flex-1 px-5 py-3 md:px-8 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm md:text-base rounded-md shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>Remove Background</span>
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Preview Canvas / Comparison */}
            <div className="p-4 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Result Preview Container */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-gray-950 dark:text-white mb-2">
                    {processedUrl ? "AI Cutout Preview" : "Original Image"}
                  </span>
                  <div
                    className={`relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center p-2 shadow-inner ${
                      bgType === "transparent"
                        ? "bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] dark:bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)]"
                        : ""
                    }`}
                    style={{
                      backgroundColor: bgType === "color" ? bgColor : undefined,
                      backgroundImage:
                        bgType === "gradient" ? bgGradient : undefined,
                    }}
                  >
                    {/* Display image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        processedUrl
                          ? processedUrl
                          : originalPreview || undefined
                      }
                      alt="Preview"
                      className="max-h-full max-w-full object-contain drop-shadow-sm select-none"
                    />
                  </div>
                </div>

                {/* Compare Original side-by-side or Controls */}
                {showOriginalComparison && originalPreview ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-gray-950 dark:text-white mb-2">
                      Original Image
                    </span>
                    <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={originalPreview}
                        alt="Original"
                        className="max-h-full max-w-full object-contain select-none"
                      />
                    </div>
                  </div>
                ) : (
                  /* Background replacement studio controls */
                  processedUrl && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-2 mb-3">
                          <PaintBrushIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          Background Replacement
                        </h3>

                        {/* Background Type Selector */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            { id: "transparent", label: "Transparent" },
                            { id: "color", label: "Solid Color" },
                            { id: "gradient", label: "Gradient" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() =>
                                setBgType(
                                  tab.id as
                                    | "transparent"
                                    | "color"
                                    | "gradient",
                                )
                              }
                              className={`py-2 px-3 text-xs md:text-sm font-bold rounded-md border transition-all ${
                                bgType === tab.id
                                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-xs"
                                  : "border-gray-250 dark:border-gray-700 text-gray-950 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Solid Color Palette */}
                        {bgType === "color" && (
                          <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="flex flex-wrap gap-2 items-center">
                              {solidColorPresets.map((preset) => (
                                <button
                                  key={preset.value}
                                  onClick={() => setBgColor(preset.value)}
                                  aria-label={`Select ${preset.name} background`}
                                  style={{ backgroundColor: preset.value }}
                                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                                    bgColor.toLowerCase() ===
                                    preset.value.toLowerCase()
                                      ? "border-blue-600 scale-110 shadow-md"
                                      : "border-gray-300 dark:border-gray-600"
                                  }`}
                                >
                                  {bgColor.toLowerCase() ===
                                    preset.value.toLowerCase() && (
                                    <CheckIcon
                                      className={`w-4 h-4 ${preset.value === "#ffffff" ? "text-black" : "text-white"}`}
                                    />
                                  )}
                                </button>
                              ))}

                              {/* Custom Hex Picker */}
                              <label className="flex items-center gap-2 cursor-pointer ml-1">
                                <input
                                  type="color"
                                  value={bgColor}
                                  onChange={(e) => setBgColor(e.target.value)}
                                  className="w-8 h-8 rounded-full cursor-pointer border border-gray-300 dark:border-gray-600 overflow-hidden"
                                />
                                <span className="text-xs font-semibold text-gray-950 dark:text-white">
                                  Custom
                                </span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Gradient Presets */}
                        {bgType === "gradient" && (
                          <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-200">
                            {gradientPresets.map((preset) => (
                              <button
                                key={preset.name}
                                onClick={() => setBgGradient(preset.value)}
                                style={{ background: preset.value }}
                                className={`h-12 rounded-md border-2 transition-transform hover:scale-105 flex items-center justify-center shadow-xs ${
                                  bgGradient === preset.value
                                    ? "border-blue-600 scale-105"
                                    : "border-transparent"
                                }`}
                              >
                                {bgGradient === preset.value && (
                                  <CheckIcon className="w-5 h-5 text-white drop-shadow-md" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Download Section */}
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <button
                          onClick={handleDownload}
                          className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-md active:scale-99 transition-all flex items-center justify-center gap-2"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                          Download High-Res PNG
                        </button>
                        <button
                          onClick={handleClear}
                          className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-950 dark:text-white font-semibold rounded-md text-sm transition-colors"
                        >
                          Process Another Image
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
