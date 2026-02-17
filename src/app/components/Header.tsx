// src/components/Header.tsx
"use client";

import Link from "next/link";
import { PhotoIcon } from "@heroicons/react/24/outline";

export default function Header() {
  return (
    <header className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <PhotoIcon className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900 dark:text-white">ImageConverter</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/converter"
            className="text-sm text-gray-600 dark:text-white hover:text-blue-600 transition-colors"
          >
            Image Tools
          </Link>
          <Link
            href="/image-to-pdf"
            className="text-sm text-gray-600 dark:text-white hover:text-blue-600 transition-colors"
          >
            PDF Tools
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-600 dark:text-white hover:text-blue-600 transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

