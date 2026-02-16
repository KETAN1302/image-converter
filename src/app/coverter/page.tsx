"use client";

import { useState, DragEvent, useRef, useEffect } from "react";
import NextImage from "next/image";
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface ConvertedFile {
  name: string;
  data: string;
  size: number;
  width?: number;
  height?: number;
}

interface ApiFile {
  name: string;
  data: string;
}

type DirectoryInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string;
  directory?: string;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState("png");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quality, setQuality] = useState("80");
  const [results, setResults] = useState<ConvertedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const items = Array.from(e.dataTransfer.items);
    const imageFiles: File[] = [];

    const processEntry = async (
      entry: FileSystemFileEntry | FileSystemDirectoryEntry,
    ) => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;

        const file = await new Promise<File>((resolve) =>
          fileEntry.file(resolve),
        );

        if (file.type.startsWith("image/")) {
          imageFiles.push(file);
          simulateUploadProgress(file.name);
        }
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();

        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          reader.readEntries(resolve);
        });

        for (const childEntry of entries) {
          await processEntry(
            childEntry as FileSystemFileEntry | FileSystemDirectoryEntry,
          );
        }
      }
    };

    Promise.all(
      items.map(async (item) => {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          await processEntry(
            entry as FileSystemFileEntry | FileSystemDirectoryEntry,
          );
        } else {
          const file = item.getAsFile();
          if (file && file.type.startsWith("image/")) {
            imageFiles.push(file);
            simulateUploadProgress(file.name);
          }
        }
      }),
    ).then(() => {
      setFiles((prev) => [...prev, ...imageFiles]);
    });
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    selectedFiles.forEach((file) => {
      simulateUploadProgress(file.name);
    });
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    selectedFiles.forEach((file) => {
      simulateUploadProgress(file.name);
    });
    setFiles((prev) => [...prev, ...selectedFiles]);
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
    setFiles([]);
    setUploadProgress({});
    setResults([]);
    setError(null);
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

    const formData = new FormData();

    files.forEach((file) => formData.append("files", file));
    formData.append("format", format);
    formData.append("width", width);
    formData.append("height", height);
    formData.append("quality", quality);

    try {
      const res = await fetch("/API/convert", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      if (data.files && data.files.length > 0) {
        // Add file sizes to results
        const resultsWithSizes = await Promise.all(
          data.files.map(async (file: ApiFile) => {
            // Calculate base64 string size
            const base64Data = file.data.split(",")[1] || file.data;
            const sizeInBytes = Math.round((base64Data.length * 3) / 4);

            // Get image dimensions
            const img = new Image();
            await new Promise((resolve) => {
              img.onload = resolve;
              img.src = file.data;
            });

            return {
              ...file,
              size: sizeInBytes,
              width: img.width,
              height: img.height,
            };
          }),
        );
        setResults(resultsWithSizes);
      } else {
        setError("No files were converted");
      }
    } catch (error: unknown) {
      console.error("Conversion failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Conversion failed. Please try again.";
      setError(message);
    } finally {
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
    <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Image Converter
          </h1>
          <p className="text-xs md:text-base text-gray-600">
            Convert and optimize your images
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Upload Section */}
        <div className="mb-4 md:mb-8">
          {/* Main Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`
              relative w-full p-6 md:p-8 mb-4 border-3 border-dashed rounded-xl md:rounded-2xl
              transition-all duration-300 cursor-pointer
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 scale-102 shadow-lg"
                  : "border-gray-300 hover:border-gray-400 bg-white hover:shadow-md"
              }
            `}
          >
            <div className="text-center">
              <CloudArrowUpIcon
                className={`w-12 h-12 md:w-20 md:h-20 mx-auto mb-2 md:mb-4 transition-all duration-300 ${
                  isDragging ? "text-blue-500 scale-110" : "text-gray-400"
                }`}
              />

              <p className="text-base md:text-xl font-semibold text-gray-700 mb-1 md:mb-2">
                {isDragging
                  ? "Drop here"
                  : isMobile
                    ? "Tap to upload"
                    : "Drag & drop here"}
              </p>

              <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
                {isMobile
                  ? "JPG, PNG, GIF, WebP"
                  : "Supports: JPG, PNG, GIF, WebP, AVIF, TIFF"}
              </p>

              {/* Upload Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white text-sm md:text-base rounded-lg active:bg-blue-700 hover:bg-blue-700 transition-colors shadow-md active:shadow-lg"
                >
                  <PhotoIcon className="w-4 h-4 md:w-5 md:h-5" />
                  Select Images
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-purple-600 text-white text-sm md:text-base rounded-lg active:bg-purple-700 hover:bg-purple-700 transition-colors shadow-md active:shadow-lg"
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  Select Folder
                </button>
              </div>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            {...({ webkitdirectory: "", directory: "" } as DirectoryInputProps)}
            className="hidden"
            onChange={handleFolderSelect}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Conversion Options */}
        <div className="mb-4 md:mb-6">
          <div className="p-4 md:p-6 bg-white rounded-xl shadow-sm border-2 border-blue-100">
            <div className="flex items-center mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                Conversion Options
              </h2>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Basic Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Format Selection */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">
                    Output Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="png">PNG - Lossless</option>
                    <option value="jpg">JPG - Best for photos</option>
                    <option value="webp">WebP - Modern format</option>
                    <option value="avif">AVIF - High compression</option>
                  </select>
                </div>

                {/* Quality Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs md:text-sm font-medium text-gray-600">
                      Quality
                    </label>
                    <span className="text-xs md:text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      {quality}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small file</span>
                    <span>High quality</span>
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="pt-3 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-3">
                  Dimensions (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Auto"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Auto"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty to maintain original aspect ratio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files Preview */}
        {files.length > 0 && (
          <div className="mb-4 md:mb-6 p-4 md:p-6 bg-white rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-green-600 rounded-full"></span>
                Selected Files ({files.length})
              </h2>
              <button
                onClick={clearAllFiles}
                className="text-xs md:text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Scrollable file list */}
            <div className="space-y-2 max-h-60 md:max-h-96 overflow-y-auto pr-1 md:pr-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shrink-0 relative">
                    <NextImage
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      fill
                      unoptimized
                      className="object-cover"
                      onLoad={(e) =>
                        URL.revokeObjectURL((e.target as HTMLImageElement).src)
                      }
                    />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>

                    {/* Progress Bar */}
                    {uploadProgress[file.name] !== undefined &&
                      uploadProgress[file.name] < 100 && (
                        <div className="mt-1 md:mt-2">
                          <div className="flex items-center gap-1 md:gap-2">
                            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{
                                  width: `${uploadProgress[file.name]}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {uploadProgress[file.name]}%
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Upload Complete */}
                    {uploadProgress[file.name] === 100 && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircleIcon className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                        <span className="text-xs text-green-600">Ready</span>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 md:p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                  >
                    <XMarkIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={files.length === 0 || isConverting}
          className={`
            w-full py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg
            transition-all duration-200 active:scale-98 hover:scale-102
            flex items-center justify-center gap-2
            ${
              files.length > 0 && !isConverting
                ? "bg-linear-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {isConverting ? (
            <>
              <div className="w-5 h-5 md:w-6 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>Converting...</span>
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span>
                {files.length > 0
                  ? `Convert ${files.length} ${files.length === 1 ? "Image" : "Images"}`
                  : "Select Images"}
              </span>
            </>
          )}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 md:mt-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-3 md:mb-4 flex items-center gap-2">
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
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Image Container */}
                    <div className="aspect-video bg-gray-100 relative group">
                      <NextImage
                        src={file.data}
                        alt={file.name}
                        fill
                        unoptimized
                        className="object-contain"
                      />

                      {/* Download Overlay */}
                      <a
                        href={file.data}
                        download={file.name}
                        className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group"
                      >
                        <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-200 shadow-lg">
                          <ArrowDownTrayIcon className="w-5 h-5 text-gray-700" />
                        </div>
                      </a>
                    </div>

                    {/* File Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-gray-700 truncate"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
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
                              <DocumentTextIcon className="w-3 h-3 text-gray-400" />
                              <span
                                className={`text-xs font-medium ${savings.isReduced ? "text-green-600" : "text-orange-600"}`}
                              >
                                {savings.isReduced ? "↓" : "↑"}{" "}
                                {Math.abs(Number(savings.percentage))}%
                              </span>
                              {originalFile && (
                                <span className="text-xs text-gray-400">
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
                          className="shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
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
