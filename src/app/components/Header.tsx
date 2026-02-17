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
          <span className="font-semibold text-gray-900">ImageConverter</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/coverter"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Image Tools
          </Link>
          <Link
            href="/pdf-to-image"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            PDF Tools
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}

