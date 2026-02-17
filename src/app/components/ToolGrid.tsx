// src/components/ToolsGrid.tsx
"use client";

import Link from "next/link";
import {
  PhotoIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function ToolsGrid() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
        All Tools
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Converter */}
        <Link href="/converter" className="group">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PhotoIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Convert IMAGE{" "}
            </h3>
            <p className="text-sm text-gray-500 dark:text-white mb-4">
              Convert between PNG, JPG, WebP, AVIF, and GIF
            </p>
            <span className="text-sm text-blue-600 font-medium group-hover:gap-2 inline-flex items-center gap-1">
              Try now <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Image to PDF */}
        <Link href="/image-to-pdf" className="group">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-green-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DocumentTextIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Image to PDF
            </h3>
            <p className="text-sm text-gray-500 dark:text-white mb-4">
              Convert multiple images to a single PDF document
            </p>
            <span className="text-sm text-green-600 font-medium group-hover:gap-2 inline-flex items-center gap-1">
              Try now <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* PDF to Image */}
        <Link href="/pdf-to-image" className="group">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-purple-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DocumentArrowUpIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Compress IMAGE
            </h3>
            <p className="text-sm text-gray-500 dark:text-white mb-4">
              Reduce image file sizes while preserving visual quality
            </p>
            <span className="text-sm text-purple-600 font-medium group-hover:gap-2 inline-flex items-center gap-1">
              Try now <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Resize IMAGE */}
        <Link href="/converter" className="group">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-yellow-500 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PhotoIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Resize IMAGE
            </h3>
            <p className="text-sm text-gray-500 dark:text-white mb-4">
              Resize images to custom dimensions or percentages
            </p>
            <span className="text-sm text-yellow-600 font-medium group-hover:gap-2 inline-flex items-center gap-1">
              Try now <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
