// src/components/HeroSection.tsx
"use client";

import Link from "next/link";
import {
  SparklesIcon,
  PhotoIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ScissorsIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import { LiaCompressArrowsAltSolid } from "react-icons/lia";
import { MdOutlineRotate90DegreesCw } from "react-icons/md";



export default function HeroSection() {
  const tools = [
    {
      href: "/converter",
      icon: PhotoIcon,
      label: "Image Converter",
      description: "Convert between image formats",
    },
    {
      href: "/image-to-pdf",
      icon: DocumentTextIcon,
      label: "Image to PDF",
      description: "Convert images to PDF",
    },
    {
      href: "/compress",
      icon: LiaCompressArrowsAltSolid,
      label: "Compress",
      description: "Reduce image file size",
    },
    {
      href: "/crop",
      icon: ScissorsIcon,
      label: "Crop",
      description: "Crop and resize images",
    },
    {
      href: "/resize",
      icon: ArrowsPointingOutIcon,
      label: "Resize",
      description: "Change image dimensions",
    },
    {
      href: "/rotate",
      icon: MdOutlineRotate90DegreesCw,
      label: "Rotate",
      description: "Rotate images",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
      {/* New Feature Badge */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
          <SparklesIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-600 font-medium">
            Complete Image & PDF Toolkit
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Convert & Edit Images
          <span className="text-blue-600"> Effortlessly</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Free, fast, and private. Convert, compress, crop, resize, and rotate
          images. Create PDFs from images. No sign-up required.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/converter"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <PhotoIcon className="w-5 h-5" />
            Get Started
            <ArrowRightIcon className="w-4 h-4" />
          </Link>

          <Link
            href="/image-to-pdf"
            className="inline-flex items-center gap-2 bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white px-8 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Create PDF
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {tool.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tool.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
