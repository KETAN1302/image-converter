// src/components/HeroSection.tsx
"use client";

import Link from "next/link";
import {
  SparklesIcon,
  PhotoIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";

export default function HeroSection() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
      {/* New Feature Badge */}
      <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
        <SparklesIcon className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-blue-600 font-medium">
          New: PDF Tools Added!
        </span>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        Convert Images & PDFs
        <span className="text-blue-600"> Instantly</span>
      </h1>

      {/* Subheading */}
      <p className="text-lg text-gray-600 dark:text-white max-w-2xl mx-auto mb-8">
        Free, fast, and private. Convert between images and PDF formats. No
        sign-up required.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/coverter"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PhotoIcon className="w-4 h-4" />
          Image Converter
          <ArrowRightIcon className="w-4 h-4" />
        </Link>

        <Link
          href="/image-to-pdf"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          <DocumentTextIcon className="w-4 h-4" />
          Image to PDF
        </Link>

        <Link
          href="/pdf-to-image"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <DocumentArrowUpIcon className="w-4 h-4" />
          PDF to Image
        </Link>
      </div>
    </section>
  );
}
