"use client";

import { useState } from "react";
import Image from "next/image";
import JSZip from "jszip";
import ToolHeader from "../components/ToolHeader";
import Dropzone from "../components/Dropzone";
import {
  Squares2X2Icon,
  ExclamationCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface IconItem {
  size: number;
  label: string;
  icoName: string;
  icoBase64: string;
  icoSize: number;
  pngName: string;
  pngBase64: string;
  pngSize: number;
}

interface ConvertedResults {
  baseName: string;
  zipUrl: string;
  zipFileName: string;
  zipSize: number;
  combinedIco: {
    name: string;
    base64: string;
    size: number;
  };
  icons: IconItem[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([
    16, 32, 48, 64, 128, 256,
  ]);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<ConvertedResults | null>(null);

  const sizeOptions = [16, 32, 48, 64, 128, 256];

  const sizeLabels: Record<number, string> = {
    16: "Favicon",
    32: "Browser tab",
    48: "Desktop shortcut",
    64: "High DPI icon",
    128: "Large preview",
    256: "Extra large icon",
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const processFile = (uploadedFile: File) => {
    if (!uploadedFile.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPEG, GIF, BMP, WebP)");
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setResults(null);
    setFile(uploadedFile);

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 60);

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
    if (results?.zipUrl) {
      URL.revokeObjectURL(results.zipUrl);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadProgress(0);
    setSelectedSizes([16, 32, 48, 64, 128, 256]);
    setLoading(false);
    setResults(null);
  };

function createIcoFromPngs(pngBuffers: { size: number; data: Uint8Array }[]): Uint8Array {
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = numImages * dirEntrySize;

  let totalSize = headerSize + dirSize;
  for (const png of pngBuffers) {
    totalSize += png.data.length;
  }

  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);

  // Header: 2 bytes reserved (0), 2 bytes type (1 = ICO), 2 bytes image count
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, numImages, true);

  let currentImageOffset = headerSize + dirSize;

  for (let i = 0; i < numImages; i++) {
    const png = pngBuffers[i];
    const entryOffset = headerSize + i * dirEntrySize;

    out[entryOffset + 0] = png.size >= 256 ? 0 : png.size;
    out[entryOffset + 1] = png.size >= 256 ? 0 : png.size;
    out[entryOffset + 2] = 0;
    out[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, png.data.length, true);
    view.setUint32(entryOffset + 12, currentImageOffset, true);

    out.set(png.data, currentImageOffset);
    currentImageOffset += png.data.length;
  }

  return out;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

  const generateIconsClientSide = async (
    sourceFile: File,
    sizes: number[]
  ): Promise<ConvertedResults> => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(sourceFile);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load source image"));
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    const icons: IconItem[] = [];
    const zip = new JSZip();
    const pngItems: { size: number; data: Uint8Array }[] = [];

    const SIZE_LABELS: Record<number, string> = {
      16: "Favicon",
      32: "Browser tab",
      48: "Desktop shortcut",
      64: "High DPI icon",
      128: "Large preview",
      256: "Extra large icon",
    };

    const sortedSizes = [...sizes].sort((a, b) => a - b);

    for (const sz of sortedSizes) {
      const canvas = document.createElement("canvas");
      canvas.width = sz;
      canvas.height = sz;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) continue;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, sz, sz);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to render icon"))),
          "image/png"
        );
      });

      const arrayBuffer = await blob.arrayBuffer();
      const pngUint8 = new Uint8Array(arrayBuffer);
      pngItems.push({ size: sz, data: pngUint8 });

      // Generate individual ICO
      const icoUint8 = createIcoFromPngs([{ size: sz, data: pngUint8 }]);
      const icoBase64 = uint8ArrayToBase64(icoUint8);
      const pngBase64 = uint8ArrayToBase64(pngUint8);

      const icoName = `favicon${sz}x${sz}.ico`;
      const pngName = `favicon${sz}x${sz}.png`;

      zip.file(icoName, icoUint8);
      zip.file(pngName, pngUint8);

      icons.push({
        size: sz,
        label: SIZE_LABELS[sz] || `${sz}x${sz}`,
        icoName,
        pngName,
        icoBase64,
        pngBase64,
        icoSize: icoUint8.byteLength,
        pngSize: pngUint8.byteLength,
      });
    }

    // Generate combined multi-resolution ICO containing all sizes
    const combinedIcoUint8 = createIcoFromPngs(pngItems);
    const combinedIcoBase64 = uint8ArrayToBase64(combinedIcoUint8);
    zip.file("favicon-multisize.ico", combinedIcoUint8);

    const zipBlob = await zip.generateAsync({ type: "blob", compression: "STORE" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipFileName = "favicon.zip";

    return {
      baseName: "favicon",
      zipUrl,
      zipFileName,
      zipSize: zipBlob.size,
      combinedIco: {
        name: "favicon-multisize.ico",
        base64: combinedIcoBase64,
        size: combinedIcoUint8.byteLength,
      },
      icons,
    };
  };

  const handleConvert = async () => {
    if (!file || selectedSizes.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Generate multi-resolution and single ICOs directly on client (instant, no server limits)
      const clientResults = await generateIconsClientSide(file, selectedSizes);
      setResults(clientResults);

      const a = document.createElement("a");
      a.href = clientResults.zipUrl;
      a.download = clientResults.zipFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (clientErr) {
      console.warn("Client ICO creation failed, attempting server API:", clientErr);
      // 2. Server API fallback
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sizes", JSON.stringify(selectedSizes));

        const res = await fetch("/api/ico", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const rawText = await res.text().catch(() => "");
          let errorMsg = "Conversion failed";
          try {
            const parsed = JSON.parse(rawText);
            if (parsed?.error) errorMsg = parsed.error;
          } catch {
            if (res.status === 413) {
              errorMsg = "File size exceeds server upload limit.";
            }
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        const zip = new JSZip();

        zip.file(
          data.combinedIco.name || "favicon-multisize.ico",
          data.combinedIco.base64,
          { base64: true },
        );

        data.icons.forEach((icon: IconItem) => {
          zip.file(icon.icoName, icon.icoBase64, { base64: true });
        });

        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "STORE",
        });

        const zipUrl = URL.createObjectURL(zipBlob);
        const zipFileName = "favicon.zip";

        const convertedData: ConvertedResults = {
          baseName: "favicon",
          zipUrl,
          zipFileName,
          zipSize: zipBlob.size,
          combinedIco: data.combinedIco,
          icons: data.icons,
        };

        setResults(convertedData);

        const a = document.createElement("a");
        a.href = zipUrl;
        a.download = zipFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (fallbackErr) {
        console.error("Conversion error:", fallbackErr);
        const msg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Failed to convert image. Please try again.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <ToolHeader
        title="Image to ICO Converter"
        subtitle="Convert images to Windows ICO & download complete multi-size icon zip pack"
      />

      <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 shadow-sm animate-in fade-in">
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

        {/* Upload Section (When no file uploaded and no results) */}
        {!file && !results && (
          <Dropzone
            onFilesSelected={(files) => {
              if (files[0]) processFile(files[0]);
            }}
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
            ariaLabel="Upload image to convert to ICO"
            subtitle="Supports: PNG, JPEG, WebP, GIF, BMP (Max 10MB)"
          />
        )}

        {/* Configuration Section (When file is chosen and not yet converted) */}
        {file && !results && (
          <div className="grid grid-cols-1 gap-6">
            {/* Image Preview & File Info */}
            {preview && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-5 md:h-6 bg-blue-600 rounded-full"></span>
                    Selected Image
                  </h2>
                  <button
                    onClick={clearAll}
                    className="text-xs md:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700/50">
                  <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                    <Image
                      src={preview}
                      alt={file.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-950 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatFileSize(file.size)} • {file.type || "Image"}
                    </p>
                    {uploadProgress < 100 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {uploadProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-950 dark:text-white flex items-center gap-2">
                    <Squares2X2Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Select Icon Sizes to Include
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Each chosen size will be packaged inside your downloaded ZIP
                    bundle
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 font-semibold transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Sizes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                {sizeOptions.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <label
                      key={size}
                      className={`relative flex items-center p-3.5 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Include ${size}x${size} pixel icon size`}
                        checked={isSelected}
                        onChange={() => handleSizeToggle(size)}
                        className="w-4 h-4 text-blue-600 rounded mr-3 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold block text-gray-950 dark:text-white">
                          {size} × {size} px
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-300 truncate block">
                          {sizeLabels[size] || "Standard"}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {selectedSizes.length === 0 ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-5">
                  <p className="text-xs md:text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                    Please select at least one size to convert.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 rounded-lg p-3 mb-5 flex items-center justify-between">
                  <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 font-semibold flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {selectedSizes.length} size
                    {selectedSizes.length > 1 ? "s" : ""} selected &bull;
                    Generates ZIP containing favicon.ico + individual icons
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 items-center">
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 cursor-pointer text-sm md:text-base"
                >
                  <XMarkIcon aria-hidden="true" className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={!file || selectedSizes.length === 0 || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-99 text-sm md:text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-5 w-5 text-white" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="w-5 h-5" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results View (After Conversion) */}
        {results && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Success Card with Action Buttons */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-5 md:p-6 shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full text-green-600 dark:text-green-400 shrink-0">
                    <CheckCircleIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                      favicon.zip Downloaded Successfully!
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong className="text-gray-900 dark:text-white font-semibold">
                        {results.zipFileName}
                      </strong>{" "}
                      ({formatFileSize(results.zipSize)})
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <a
                    href={results.zipUrl}
                    download={results.zipFileName}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold cursor-pointer"
                  >
                    <span>Download Again</span>
                  </a>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Package Summary & Contents Preview */}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
