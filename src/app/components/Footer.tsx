// src/components/Footer.tsx
"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="max-w-4xl mx-auto px-4 py-8 border-t border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Footer Text */}
        <p className="text-sm text-gray-500 text-center md:text-left">
          Simple, fast, and private. Your files stay on your device.
        </p>

        {/* Footer Links */}
        <div className="flex gap-4">
          <Link
            href="/coverter"
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            Image Converter
          </Link>
          <Link
            href="/image-to-pdf"
            className="text-xs text-gray-500 hover:text-green-600 transition-colors"
          >
            Image to PDF
          </Link>
          <Link
            href="/pdf-to-image"
            className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
          >
            PDF to Image
          </Link>
        </div>
      </div>
    </footer>
  );
}
