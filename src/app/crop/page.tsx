"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import {
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ScissorsIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ChevronsLeft } from "lucide-react";

interface CroppedFile {
  name: string;
  data: string;
  preview?: string;
}

export default function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [cropCoords, setCropCoords] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [imgDimensions, setImgDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CroppedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Detect mobile on mount
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
        setImgDimensions({
          width: img.width,
          height: img.height,
        });
        setCropCoords({
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
        });
      };
      img.src = event.target?.result as string;
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

  const handleCropChange = (key: string, value: number) => {
    const updated = { ...cropCoords, [key]: Math.max(0, value) };
    setCropCoords(updated);
  };

  const getMousePos = (e: { clientX: number; clientY: number }) => {
    if (!cropContainerRef.current) return { x: 0, y: 0 };
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };

    const imgRect = img.getBoundingClientRect();
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;

    return { x, y };
  };

  const getHandleAtPosition = (
    x: number,
    y: number,
    threshold?: number,
  ): string | null => {
    const touchThreshold = isMobile ? 15 : 10;
    const finalThreshold = threshold || touchThreshold;
    const scaleX = (imgRef.current?.width || 0) / imgDimensions.width;
    const scaleY = (imgRef.current?.height || 0) / imgDimensions.height;

    const cropX = cropCoords.x * scaleX;
    const cropY = cropCoords.y * scaleY;
    const cropW = cropCoords.width * scaleX;
    const cropH = cropCoords.height * scaleY;

    // Check corners
    if (
      Math.abs(x - cropX) < finalThreshold &&
      Math.abs(y - cropY) < finalThreshold
    ) {
      return "nw-resize";
    }
    if (
      Math.abs(x - (cropX + cropW)) < finalThreshold &&
      Math.abs(y - cropY) < finalThreshold
    ) {
      return "ne-resize";
    }
    if (
      Math.abs(x - cropX) < finalThreshold &&
      Math.abs(y - (cropY + cropH)) < finalThreshold
    ) {
      return "sw-resize";
    }
    if (
      Math.abs(x - (cropX + cropW)) < finalThreshold &&
      Math.abs(y - (cropY + cropH)) < finalThreshold
    ) {
      return "se-resize";
    }

    // Check edges
    if (
      Math.abs(x - cropX) < finalThreshold &&
      y > cropY &&
      y < cropY + cropH
    ) {
      return "w-resize";
    }
    if (
      Math.abs(x - (cropX + cropW)) < finalThreshold &&
      y > cropY &&
      y < cropY + cropH
    ) {
      return "e-resize";
    }
    if (
      Math.abs(y - cropY) < finalThreshold &&
      x > cropX &&
      x < cropX + cropW
    ) {
      return "n-resize";
    }
    if (
      Math.abs(y - (cropY + cropH)) < finalThreshold &&
      x > cropX &&
      x < cropX + cropW
    ) {
      return "s-resize";
    }

    // Check if inside crop area (for moving)
    if (x > cropX && x < cropX + cropW && y > cropY && y < cropY + cropH) {
      return "move";
    }

    return null;
  };

  const handleImageMouseDown = (e: { clientX: number; clientY: number }) => {
    if (!imgRef.current) return;
    const { x, y } = getMousePos(e);
    const handle = getHandleAtPosition(x, y);

    if (handle) {
      setIsDrawing(true);
      setDragHandle(handle);
      setStartX(x);
      setStartY(y);
    }
  };

  const handleImageMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!imgRef.current) return;
    const { x, y } = getMousePos(e);

    if (!isDrawing) {
      const handle = getHandleAtPosition(x, y);
      if (cropContainerRef.current) {
        cropContainerRef.current.style.cursor = handle || "default";
      }
      return;
    }

    const scaleX = imgDimensions.width / (imgRef.current?.width || 1);
    const scaleY = imgDimensions.height / (imgRef.current?.height || 1);

    const deltaX = (x - startX) * scaleX;
    const deltaY = (y - startY) * scaleY;

    const newCoords = { ...cropCoords };

    if (dragHandle === "move") {
      newCoords.x = Math.max(
        0,
        Math.min(cropCoords.x + deltaX, imgDimensions.width - cropCoords.width),
      );
      newCoords.y = Math.max(
        0,
        Math.min(
          cropCoords.y + deltaY,
          imgDimensions.height - cropCoords.height,
        ),
      );
    } else if (dragHandle === "nw-resize") {
      newCoords.x = Math.max(0, cropCoords.x + deltaX);
      newCoords.y = Math.max(0, cropCoords.y + deltaY);
      newCoords.width = Math.min(
        Math.max(50, cropCoords.width - deltaX),
        imgDimensions.width - newCoords.x,
      );
      newCoords.height = Math.min(
        Math.max(50, cropCoords.height - deltaY),
        imgDimensions.height - newCoords.y,
      );
    } else if (dragHandle === "ne-resize") {
      newCoords.y = Math.max(0, cropCoords.y + deltaY);
      newCoords.width = Math.min(
        Math.max(50, cropCoords.width + deltaX),
        imgDimensions.width - cropCoords.x,
      );
      newCoords.height = Math.min(
        Math.max(50, cropCoords.height - deltaY),
        imgDimensions.height - newCoords.y,
      );
    } else if (dragHandle === "sw-resize") {
      newCoords.x = Math.max(0, cropCoords.x + deltaX);
      newCoords.width = Math.min(
        Math.max(50, cropCoords.width - deltaX),
        imgDimensions.width - newCoords.x,
      );
      newCoords.height = Math.min(
        Math.max(50, cropCoords.height + deltaY),
        imgDimensions.height - cropCoords.y,
      );
    } else if (dragHandle === "se-resize") {
      newCoords.width = Math.min(
        Math.max(50, cropCoords.width + deltaX),
        imgDimensions.width - cropCoords.x,
      );
      newCoords.height = Math.min(
        Math.max(50, cropCoords.height + deltaY),
        imgDimensions.height - cropCoords.y,
      );
    } else if (dragHandle === "n-resize") {
      newCoords.y = Math.max(0, cropCoords.y + deltaY);
      newCoords.height = Math.min(
        Math.max(50, cropCoords.height - deltaY),
        imgDimensions.height - newCoords.y,
      );
    } else if (dragHandle === "s-resize") {
      newCoords.height = Math.min(
        Math.max(50, cropCoords.height + deltaY),
        imgDimensions.height - cropCoords.y,
      );
    } else if (dragHandle === "w-resize") {
      newCoords.x = Math.max(0, cropCoords.x + deltaX);
      newCoords.width = Math.min(
        Math.max(50, cropCoords.width - deltaX),
        imgDimensions.width - newCoords.x,
      );
    } else if (dragHandle === "e-resize") {
      newCoords.width = Math.min(
        Math.max(50, cropCoords.width + deltaX),
        imgDimensions.width - cropCoords.x,
      );
    }

    setCropCoords(newCoords);
    setStartX(x);
    setStartY(y);
  };

  const handleImageMouseUp = () => {
    setIsDrawing(false);
    setDragHandle(null);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const touch = e.touches[0];
    handleImageMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const touch = e.touches[0];
    handleImageMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  };

  const handleTouchEnd = () => {
    handleImageMouseUp();
  };

  const cropImage = async () => {
    if (!file) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("x", String(cropCoords.x));
      formData.append("y", String(cropCoords.y));
      formData.append("width", String(cropCoords.width));
      formData.append("height", String(cropCoords.height));
      formData.append("quality", "90");

      const response = await fetch("/api/crop", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to crop image");
      }

      const blob = await response.blob();

      // Create preview data URL for result
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setResult({
          name: `cropped-${file.name}`,
          data,
          preview,
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error cropping image";
      setError(msg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError(null);
    setUploadProgress(0);
    setCropCoords({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
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
          <div className="flex items-center min-w-[70px]">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-base font-semibold text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ChevronsLeft className="w-5 h-5" />
              <span>Home</span>
            </Link>
          </div>
          <div className="text-center px-2">
            <h1 className="text-xl md:text-2xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Image Cropper
            </h1>
            <p className="font-medium text-xs md:text-sm text-gray-950 dark:text-white">
              Select the area you want to keep from your image
            </p>
          </div>
          <div className="flex items-center justify-end min-w-[70px]">
            <ThemeToggle />
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
              aria-label="Upload image to crop"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* File Preview & Options */}
        {file && (
          <div className="mb-6 p-4 md:p-6 bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                Crop Settings
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
                      ref={imgRef}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs font-medium text-gray-950 dark:text-white">
                    {imgDimensions.width} × {imgDimensions.height}px
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
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-3">
                Preview - Click and drag to crop, or use handles to resize
              </label>
              <div
                ref={cropContainerRef}
                onMouseDown={handleImageMouseDown}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleImageMouseUp}
                onMouseLeave={handleImageMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="border-2 border-gray-300 dark:border-gray-600 rounded flex justify-center items-center bg-gray-50 dark:bg-gray-800 p-2 md:p-3 relative select-none touch-none"
                style={{
                  maxHeight: isMobile ? "250px" : "300px",
                  height: "auto",
                }}
              >
                {preview && (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={preview}
                      alt="Preview"
                      className="max-w-full block"
                      style={{
                        maxHeight: isMobile ? "230px" : "280px",
                      }}
                      draggable={false}
                    />

                    {/* Crop Overlay */}
                    <svg
                      className="absolute top-0 left-0 pointer-events-none"
                      width={imgRef.current?.width || 0}
                      height={imgRef.current?.height || 0}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                    >
                      {/* Darkened areas outside crop */}
                      <defs>
                        <mask id="crop-mask">
                          <rect width="100%" height="100%" fill="white" />
                          <rect
                            x={
                              (cropCoords.x / imgDimensions.width) *
                              (imgRef.current?.width || 0)
                            }
                            y={
                              (cropCoords.y / imgDimensions.height) *
                              (imgRef.current?.height || 0)
                            }
                            width={
                              (cropCoords.width / imgDimensions.width) *
                              (imgRef.current?.width || 0)
                            }
                            height={
                              (cropCoords.height / imgDimensions.height) *
                              (imgRef.current?.height || 0)
                            }
                            fill="black"
                          />
                        </mask>
                      </defs>

                      {/* Semi-transparent overlay on excluded areas */}
                      <rect
                        width="100%"
                        height="100%"
                        fill="rgba(0, 0, 0, 0.5)"
                        mask="url(#crop-mask)"
                      />

                      {/* Crop box border */}
                      <rect
                        x={
                          (cropCoords.x / imgDimensions.width) *
                          (imgRef.current?.width || 0)
                        }
                        y={
                          (cropCoords.y / imgDimensions.height) *
                          (imgRef.current?.height || 0)
                        }
                        width={
                          (cropCoords.width / imgDimensions.width) *
                          (imgRef.current?.width || 0)
                        }
                        height={
                          (cropCoords.height / imgDimensions.height) *
                          (imgRef.current?.height || 0)
                        }
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="4"
                      />

                      {/* Grid lines */}
                      <g stroke="#3b82f6" strokeWidth="1" opacity="0.3">
                        <line
                          x1={
                            (cropCoords.x / imgDimensions.width) *
                              (imgRef.current?.width || 0) +
                            ((cropCoords.width / imgDimensions.width) *
                              (imgRef.current?.width || 0)) /
                              3
                          }
                          y1={
                            (cropCoords.y / imgDimensions.height) *
                            (imgRef.current?.height || 0)
                          }
                          x2={
                            (cropCoords.x / imgDimensions.width) *
                              (imgRef.current?.width || 0) +
                            ((cropCoords.width / imgDimensions.width) *
                              (imgRef.current?.width || 0)) /
                              3
                          }
                          y2={
                            (cropCoords.y / imgDimensions.height) *
                              (imgRef.current?.height || 0) +
                            (cropCoords.height / imgDimensions.height) *
                              (imgRef.current?.height || 0)
                          }
                        />
                        <line
                          x1={
                            (cropCoords.x / imgDimensions.width) *
                              (imgRef.current?.width || 0) +
                            (cropCoords.width / imgDimensions.width) *
                              (imgRef.current?.width || 0) *
                              (2 / 3)
                          }
                          y1={
                            (cropCoords.y / imgDimensions.height) *
                            (imgRef.current?.height || 0)
                          }
                          x2={
                            (cropCoords.x / imgDimensions.width) *
                              (imgRef.current?.width || 0) +
                            (cropCoords.width / imgDimensions.width) *
                              (imgRef.current?.width || 0) *
                              (2 / 3)
                          }
                          y2={
                            (cropCoords.y / imgDimensions.height) *
                              (imgRef.current?.height || 0) +
                            (cropCoords.height / imgDimensions.height) *
                              (imgRef.current?.height || 0)
                          }
                        />
                        <line
                          x1={
                            (cropCoords.x / imgDimensions.width) *
                            (imgRef.current?.width || 0)
                          }
                          y1={
                            (cropCoords.y / imgDimensions.height) *
                              (imgRef.current?.height || 0) +
                            ((cropCoords.height / imgDimensions.height) *
                              (imgRef.current?.height || 0)) /
                              3
                          }
                          x2={
                            (cropCoords.x / imgDimensions.width) *
                              (imgRef.current?.width || 0) +
                            (cropCoords.width / imgDimensions.width) *
                              (imgRef.current?.width || 0)
                          }
                          y2={
                            (cropCoords.y / imgDimensions.height) *
                              (imgRef.current?.height || 0) +
                            ((cropCoords.height / imgDimensions.height) *
                              (imgRef.current?.height || 0)) /
                              3
                          }
                        />
                        <line
                          x1={
                            (cropCoords.x / imgDimensions.width) *
                            (imgRef.current?.width || 0)
                          }
                          y1={
                            (cropCoords.y / imgDimensions.height) *
                              (imgRef.current?.height || 0) +
                            (cropCoords.height / imgDimensions.height) *
                              (imgRef.current?.height || 0) *
                              (2 / 3)
                          }
                          x2={
                            (cropCoords.x / imgDimensions.width) *
                              (imgRef.current?.width || 0) +
                            (cropCoords.width / imgDimensions.width) *
                              (imgRef.current?.width || 0)
                          }
                          y2={
                            (cropCoords.y / imgDimensions.height) *
                              (imgRef.current?.height || 0) +
                            (cropCoords.height / imgDimensions.height) *
                              (imgRef.current?.height || 0) *
                              (2 / 3)
                          }
                        />
                      </g>

                      {/* Corner handles */}
                      <circle
                        cx={
                          (cropCoords.x / imgDimensions.width) *
                          (imgRef.current?.width || 0)
                        }
                        cy={
                          (cropCoords.y / imgDimensions.height) *
                          (imgRef.current?.height || 0)
                        }
                        r={isMobile ? "10" : "6"}
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                        className="pointer-events-auto"
                        style={{ cursor: "nw-resize" }}
                      />
                      <circle
                        cx={
                          (cropCoords.x / imgDimensions.width) *
                            (imgRef.current?.width || 0) +
                          (cropCoords.width / imgDimensions.width) *
                            (imgRef.current?.width || 0)
                        }
                        cy={
                          (cropCoords.y / imgDimensions.height) *
                          (imgRef.current?.height || 0)
                        }
                        r={isMobile ? "10" : "6"}
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                        className="pointer-events-auto"
                        style={{ cursor: "ne-resize" }}
                      />
                      <circle
                        cx={
                          (cropCoords.x / imgDimensions.width) *
                          (imgRef.current?.width || 0)
                        }
                        cy={
                          (cropCoords.y / imgDimensions.height) *
                            (imgRef.current?.height || 0) +
                          (cropCoords.height / imgDimensions.height) *
                            (imgRef.current?.height || 0)
                        }
                        r={isMobile ? "10" : "6"}
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                        className="pointer-events-auto"
                        style={{ cursor: "sw-resize" }}
                      />
                      <circle
                        cx={
                          (cropCoords.x / imgDimensions.width) *
                            (imgRef.current?.width || 0) +
                          (cropCoords.width / imgDimensions.width) *
                            (imgRef.current?.width || 0)
                        }
                        cy={
                          (cropCoords.y / imgDimensions.height) *
                            (imgRef.current?.height || 0) +
                          (cropCoords.height / imgDimensions.height) *
                            (imgRef.current?.height || 0)
                        }
                        r={isMobile ? "10" : "6"}
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                        className="pointer-events-auto"
                        style={{ cursor: "se-resize" }}
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Crop Controls */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-950 dark:text-white mb-3">
                Crop Coordinates
              </label>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div>
                  <label htmlFor="crop-x" className="block text-xs font-semibold text-gray-950 dark:text-white mb-1">
                    X
                  </label>
                  <input
                    id="crop-x"
                    type="number"
                    aria-label="Crop X coordinate in pixels"
                    value={cropCoords.x}
                    onChange={(e) =>
                      handleCropChange("x", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-2 text-xs md:text-sm font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="crop-y" className="block text-xs font-semibold text-gray-950 dark:text-white mb-1">
                    Y
                  </label>
                  <input
                    id="crop-y"
                    type="number"
                    aria-label="Crop Y coordinate in pixels"
                    value={cropCoords.y}
                    onChange={(e) =>
                      handleCropChange("y", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-2 text-xs md:text-sm font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="crop-w" className="block text-xs font-semibold text-gray-950 dark:text-white mb-1">
                    W
                  </label>
                  <input
                    id="crop-w"
                    type="number"
                    aria-label="Crop width in pixels"
                    value={cropCoords.width}
                    onChange={(e) =>
                      handleCropChange("width", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-2 text-xs md:text-sm font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="crop-h" className="block text-xs font-semibold text-gray-950 dark:text-white mb-1">
                    H
                  </label>
                  <input
                    id="crop-h"
                    type="number"
                    aria-label="Crop height in pixels"
                    value={cropCoords.height}
                    onChange={(e) =>
                      handleCropChange("height", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-2 text-xs md:text-sm font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Crop Button */}
            <button
              onClick={cropImage}
              disabled={loading}
              className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <ScissorsIcon aria-hidden="true" className="w-6 h-6" />
              {loading ? "Processing..." : "Crop Image"}
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white dark:bg-gray-900 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2 mb-4">
              <span className="w-1 h-5 md:h-6 bg-green-600 rounded-full"></span>
              Cropped Image
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
                    {cropCoords.width} × {cropCoords.height}px
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadImage}
                aria-label={`Download cropped image ${result.name}`}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <ArrowDownTrayIcon aria-hidden="true" className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={clearAll}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-950 dark:text-white font-semibold rounded transition-colors"
              >
                Crop Another
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
