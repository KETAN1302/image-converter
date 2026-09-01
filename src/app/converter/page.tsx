"use client";

import { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";

interface ConvertedFile {
  name: string;
  data: string;
  size: number;
  width?: number;
  height?: number;
  preview?: string;
}


const isImageFile = (file: File) => {
  return (
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|avif|gif|svg|heic|heif|tiff|tif)$/i.test(file.name)
  );
};

function FilePreviewImage({ file }: { file: File }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const handle = requestAnimationFrame(() => {
      setUrl(objectUrl);
    });
    return () => {
      cancelAnimationFrame(handle);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!url) return null;

  return (
    <NextImage
      src={url}
      alt={file.name}
      fill
      unoptimized
      className="object-cover"
    />
  );
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState("png");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quality, setQuality] = useState("80");
  const [results, setResults] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [error, setError] = useState<string | null>(null);

  const convertIntervalRef = useRef<number | null>(null);

  // Clear convert progress interval on unmount
  useEffect(() => {
    return () => {
      if (convertIntervalRef.current) {
        clearInterval(convertIntervalRef.current);
      }
    };
  }, []);

  const simulateUploadProgress = (fileName: string) => {
    setUploadProgress((prev) => ({ ...prev, [fileName]: 0 }));
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const currentProgress = prev[fileName] || 0;
        if (currentProgress >= 100) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [fileName]: Math.min(currentProgress + 10, 100) };
      });
    }, 50);
  };

  const handleFilesAdded = (selectedFiles: File[]) => {
    setError(null);
    const validImageFiles = selectedFiles.filter((file) => isImageFile(file));
    validImageFiles.forEach((file) => {
      simulateUploadProgress(file.name);
    });
    setFiles((prev) => [...prev, ...validImageFiles]);
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
  };

  const clearAllFiles = () => {
    if (convertIntervalRef.current) {
      clearInterval(convertIntervalRef.current);
      convertIntervalRef.current = null;
    }
    setFiles([]);
    setUploadProgress({});
    setResults([]);
    setError(null);
    setIsConverting(false);
    setConvertProgress(0);
  };

  const validateInputs = (): boolean => {
    const qualityNum = parseInt(quality);
    if (isNaN(qualityNum) || qualityNum < 1 || qualityNum > 100) {
      setError("Quality must be between 1 and 100");
      return false;
    }

    if (width) {
      const widthNum = parseInt(width);
      if (isNaN(widthNum) || widthNum < 1) {
        setError("Width must be a positive number");
        return false;
      }
    }

    if (height) {
      const heightNum = parseInt(height);
      if (isNaN(heightNum) || heightNum < 1) {
        setError("Height must be a positive number");
        return false;
      }
    }

    return true;
  };

  const convertSingleFileClient = async (
    file: File,
    targetFormat: string,
    targetWidth?: number,
    targetHeight?: number,
    targetQuality: number = 80
  ): Promise<ConvertedFile> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let finalW = img.naturalWidth || img.width;
        let finalH = img.naturalHeight || img.height;

        if (targetWidth && targetHeight) {
          finalW = targetWidth;
          finalH = targetHeight;
        } else if (targetWidth) {
          finalH = Math.round((finalH * targetWidth) / finalW);
          finalW = targetWidth;
        } else if (targetHeight) {
          finalW = Math.round((finalW * targetHeight) / finalH);
          finalH = targetHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, finalW);
        canvas.height = Math.max(1, finalH);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Could not initialize canvas context"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const fmt = targetFormat.toLowerCase();
        let mimeType = "image/jpeg";
        let extension = "jpg";

        if (fmt === "png") {
          mimeType = "image/png";
          extension = "png";
        } else if (fmt === "webp") {
          mimeType = "image/webp";
          extension = "webp";
        } else if (fmt === "jpeg" || fmt === "jpg") {
          mimeType = "image/jpeg";
          extension = fmt;
        }

        // Fill background white for JPEG if original is transparent
        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, finalW, finalH);
        }

        ctx.drawImage(img, 0, 0, finalW, finalH);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create converted image blob"));
              return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              const originalName = file.name.split(".").slice(0, -1).join(".") || "image";
              resolve({
                name: `${originalName}.${extension}`,
                data: dataUrl,
                preview: dataUrl,
                size: blob.size,
                width: finalW,
                height: finalH,
              });
            };
            reader.readAsDataURL(blob);
          },
          mimeType,
          targetQuality / 100
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load ${file.name}`));
      };

      img.src = objectUrl;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please select at least one image");
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setIsConverting(true);
    setError(null);
    setResults([]);

    const targetW = width ? parseInt(width, 10) : undefined;
    const targetH = height ? parseInt(height, 10) : undefined;
    const targetQual = parseInt(quality, 10) || 80;
    const fmt = format.toLowerCase();

    // Start simulated conversion progress
    setConvertProgress(10);
    const tickMs = 150;
    if (convertIntervalRef.current) {
      clearInterval(convertIntervalRef.current);
    }
    convertIntervalRef.current = window.setInterval(() => {
      setConvertProgress((p) => {
        const next = Math.min(95, p + 10);
        return next;
      });
    }, tickMs);

    const isClientSupportedFormat = ["png", "jpg", "jpeg", "webp"].includes(fmt);

    try {
      if (isClientSupportedFormat) {
        // 1. Client-Side High-Speed Conversion (0ms network delay, no 4.5MB Vercel limit)
        const converted = await Promise.all(
          files.map((file) =>
            convertSingleFileClient(file, fmt, targetW, targetH, targetQual)
          )
        );
        setResults(converted);
        setConvertProgress(100);
      } else {
        // 2. Server API Conversion for special formats (AVIF, TIFF, GIF, ICO, BMP)
        const convertedResults: ConvertedFile[] = [];

        // Process files individually to stay well under Vercel's 4.5MB payload limit
        for (const file of files) {
          const singleFormData = new FormData();
          singleFormData.append("files", file);
          singleFormData.append("format", format);
          if (width) singleFormData.append("width", width);
          if (height) singleFormData.append("height", height);
          singleFormData.append("quality", quality);

          const res = await fetch("/api/convert", {
            method: "POST",
            body: singleFormData,
          });

          if (!res.ok) {
            const rawText = await res.text().catch(() => "");
            let errorMsg = "Conversion failed";
            try {
              const parsed = JSON.parse(rawText);
              if (parsed?.error) errorMsg = parsed.error;
            } catch {
              if (res.status === 413) {
                errorMsg = `File ${file.name} exceeds server upload limit.`;
              }
            }
            throw new Error(errorMsg);
          }

          const data = await res.json();
          if (data.files && data.files.length > 0) {
            const convertedFile = data.files[0];
            const base64Data = convertedFile.data.split(",")[1] || convertedFile.data;
            const sizeInBytes = Math.round((base64Data.length * 3) / 4);

            convertedResults.push({
              ...convertedFile,
              size: sizeInBytes,
            });
          }
        }

        if (convertedResults.length === 0) {
          throw new Error("No files were converted");
        }

        setResults(convertedResults);
        setConvertProgress(100);
      }
    } catch (error: unknown) {
      console.error("Conversion failed:", error);
      // If server failed for any reason, attempt client-side fallback
      try {
        console.warn("Attempting client-side fallback conversion...");
        const fallbackFormat = ["png", "jpg", "jpeg", "webp"].includes(fmt) ? fmt : "png";
        const fallbackResults = await Promise.all(
          files.map((file) =>
            convertSingleFileClient(file, fallbackFormat, targetW, targetH, targetQual)
          )
        );
        setResults(fallbackResults);
        setConvertProgress(100);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : "Conversion failed. Please try again.";
        setError(message);
      }
    } finally {
      // finalize progress
      if (convertIntervalRef.current) {
        clearInterval(convertIntervalRef.current);
        convertIntervalRef.current = null;
      }
      setConvertProgress(100);
      setIsConverting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const calculateSavings = (originalSize: number, convertedSize: number) => {
    if (!originalSize || !convertedSize) return null;
    const savings = ((originalSize - convertedSize) / originalSize) * 100;
    return {
      percentage: savings.toFixed(1),
      isReduced: savings > 0,
    };
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <ToolHeader
        title="Image Converter"
        subtitle="Convert and optimize your images"
      />

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Upload Section */}
        {files.length === 0 && (
          <Dropzone
            multiple
            allowFolderUpload
            onFilesSelected={handleFilesAdded}
            onFolderSelected={handleFilesAdded}
            accept="image/*,.heic,.heif,.svg,.tiff,.tif"
            subtitle="Supports: JPG, PNG, WebP, AVIF, GIF, SVG, HEIC, TIFF"
            buttonLabel="Select Images"
            folderButtonLabel="Select Folder"
            ariaLabel="Select image files"
            folderAriaLabel="Select folder of image files"
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-start gap-3">
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

        {/* Conversion Options */}
        {files.length > 0 && (
          <div className="mb-4 md:mb-6">
            <div className="p-4 md:p-6 bg-white dark:bg-gray-900 rounded shadow-sm border-2 border-blue-100 dark:border-gray-700">
              <div className="flex items-center mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                  <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                  Conversion Options
                </h2>
              </div>

              <div className="space-y-4 md:space-y-6">
                {/* Basic Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Format Selection */}
                  <div>
                    <label
                      htmlFor="output-format"
                      className="block text-xs md:text-sm font-semibold text-gray-950 dark:text-white mb-1 md:mb-2"
                    >
                      Output Format
                    </label>
                    <select
                      id="output-format"
                      aria-label="Output Format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded p-2.5 md:p-3 text-sm md:text-base font-medium outline-none transition-all bg-white dark:bg-gray-800 text-gray-950 dark:text-white"
                    >
                      <option value="png">PNG - Lossless</option>
                      <option value="jpg">JPG - Best for photos</option>
                      <option value="jpeg">JPEG - Best for photos</option>
                      <option value="webp">WebP - Modern format</option>
                      <option value="avif">AVIF - High compression</option>
                      <option value="gif">GIF - Animated or static</option>
                      <option value="svg">SVG - Vector wrapper</option>
                      <option value="heic">
                        HEIC - High efficiency (Apple format)
                      </option>
                      <option value="tiff">TIFF - High quality print</option>
                    </select>
                  </div>

                  {/* Quality Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="quality-slider"
                        className="text-xs md:text-sm font-semibold text-gray-950 dark:text-white"
                      >
                        Quality
                      </label>
                      <span className="text-xs md:text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">
                        {quality}%
                      </span>
                    </div>
                    <input
                      id="quality-slider"
                      type="range"
                      aria-label="Quality Adjustment"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs font-medium text-gray-950 dark:text-white mt-1">
                      <span>Small file</span>
                      <span>High quality</span>
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-950 dark:text-white mb-3">
                    Dimensions (Optional)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="width-input"
                        className="block text-xs font-medium text-gray-950 dark:text-white mb-1"
                      >
                        Width (px)
                      </label>
                      <input
                        id="width-input"
                        type="number"
                        min="1"
                        aria-label="Target width in pixels"
                        placeholder="Auto"
                        value={width}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          e.target.value = cleaned;
                          setWidth(cleaned);
                        }}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white rounded p-2.5 md:p-3 text-sm md:text-base font-medium outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="height-input"
                        className="block text-xs font-medium text-gray-950 dark:text-white mb-1"
                      >
                        Height (px)
                      </label>
                      <input
                        id="height-input"
                        type="number"
                        min="1"
                        aria-label="Target height in pixels"
                        placeholder="Auto"
                        value={height}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/^0+(?=\d)/, "");
                          e.target.value = cleaned;
                          setHeight(cleaned);
                        }}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white rounded p-2.5 md:p-3 text-sm md:text-base font-medium outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
                      />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-950 dark:text-white mt-2">
                    Leave empty to maintain original aspect ratio
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Files Preview */}
        {files.length > 0 && (
          <div className="mb-4 md:mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-green-600 rounded-full"></span>
                Selected Files ({files.length})
              </h2>
              <button
                onClick={clearAllFiles}
                className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Scrollable file list */}
            <div className="space-y-2 max-h-60 md:max-h-96 overflow-y-auto pr-1 md:pr-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shrink-0 relative">
                    <FilePreviewImage file={file} />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-gray-950 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs font-medium text-gray-950 dark:text-white">
                      {formatFileSize(file.size)}
                    </p>

                    {/* Progress Bar */}
                    {uploadProgress[file.name] !== undefined &&
                      uploadProgress[file.name] < 100 && (
                        <div className="mt-1 md:mt-2">
                          <div className="flex items-center gap-1 md:gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{
                                  width: `${uploadProgress[file.name]}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-950 dark:text-white">
                              {uploadProgress[file.name]}%
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Upload Complete */}
                    {uploadProgress[file.name] === 100 && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircleIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
                        <span className="text-xs text-green-700 dark:text-green-400 font-semibold">
                          Ready
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className="p-1.5 md:p-2 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-gray-800"
                  >
                    <XMarkIcon
                      aria-hidden="true"
                      className="w-4 h-4 md:w-5 md:h-5"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Convert Button */}
        {files.length > 0 && (
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={clearAllFiles}
              className="flex-1 px-5 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-md transition-all active:scale-98 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 cursor-pointer shadow-sm text-sm md:text-base"
            >
              <XMarkIcon aria-hidden="true" className="w-5 h-5" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleConvert}
              disabled={files.length === 0 || isConverting}
              className={`
              flex-1 px-5 py-3 rounded-md font-bold text-base md:text-lg
              transition-all duration-200 active:scale-98 hover:scale-102
              flex items-center justify-center gap-2 shadow-md cursor-pointer
              ${
                files.length > 0 && !isConverting
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              }
            `}
            >
              {isConverting ? (
                <>
                  <div className="w-5 h-5 md:w-6 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Converting... {Math.round(convertProgress)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                  <span>
                    {files.length > 0
                      ? "Convert"
                      : "Select Images"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 md:mt-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-950 dark:text-white mb-3 md:mb-4 flex items-center gap-2">
              <span className="w-1 h-5 md:h-6 bg-purple-600 rounded-full"></span>
              Converted Images
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((file, i) => {
                const originalFile = files.find(
                  (f) => f.name.split(".")[0] === file.name.split(".")[0],
                );
                const savings = originalFile
                  ? calculateSavings(originalFile.size, file.size)
                  : null;

                return (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Image Container */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative group">
                      <NextImage
                        src={file.preview || file.data}
                        alt={file.name}
                        fill
                        unoptimized
                        className="object-fill"
                      />

                      {/* Download Overlay */}
                      <a
                        href={file.data}
                        download={file.name}
                        aria-label={`Download ${file.name}`}
                        className="absolute inset-0 bg-black/20 bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group"
                      >
                        <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-200 shadow-lg">
                          <ArrowDownTrayIcon
                            aria-hidden="true"
                            className="w-5 h-5 text-gray-950"
                          />
                        </div>
                      </a>
                    </div>

                    {/* File Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold text-gray-950 dark:text-white truncate"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-950 dark:text-white mt-1">
                            <span>{formatFileSize(file.size)}</span>
                            {file.width && file.height && (
                              <>
                                <span>•</span>
                                <span>
                                  {file.width}×{file.height}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Size Comparison */}
                          {savings && (
                            <div className="mt-2 flex items-center gap-2">
                              <DocumentTextIcon
                                aria-hidden="true"
                                className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300"
                              />
                              <span
                                className={`text-xs font-bold ${savings.isReduced ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}
                              >
                                {savings.isReduced ? "↓" : "↑"}{" "}
                                {Math.abs(Number(savings.percentage))}%
                              </span>
                              {originalFile && (
                                <span className="text-xs font-medium text-gray-950 dark:text-white">
                                  from {formatFileSize(originalFile.size)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Direct Download Button */}
                        <a
                          href={file.data}
                          download={file.name}
                          aria-label={`Download ${file.name}`}
                          className="shrink-0 p-2 text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded transition-colors"
                          title="Download"
                        >
                          <ArrowDownTrayIcon
                            aria-hidden="true"
                            className="w-4 h-4"
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Download All Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  results.forEach((file) => {
                    const link = document.createElement("a");
                    link.href = file.data;
                    link.download = file.name;
                    link.click();
                  });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 transition-colors shadow-md"
              >
                <ArrowDownTrayIcon aria-hidden="true" className="w-4 h-4" />
                Download All ({results.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Padding */}
      <div className="h-4 md:h-0"></div>
    </main>
  );
}
