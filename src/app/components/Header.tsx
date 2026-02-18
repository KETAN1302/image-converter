// src/components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PhotoIcon,
  DocumentIcon,
  ScissorsIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  SwatchIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { LiaCompressArrowsAltSolid } from "react-icons/lia";
import { MdOutlineRotate90DegreesCw } from "react-icons/md";

export default function Header() {
  const [isImageToolsOpen, setIsImageToolsOpen] = useState(false);
  const [isPDFToolsOpen, setIsPDFToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileImageToolsOpen, setIsMobileImageToolsOpen] = useState(false);
  const [isMobilePDFToolsOpen, setIsMobilePDFToolsOpen] = useState(false);

  // Close mobile menu on resize if screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const imageTools = [
    {
      name: "Convert Format",
      href: "/convert",
      icon: SwatchIcon,
      description: "JPG, PNG, WEBP & more",
    },
    {
      name: "Compress Image",
      href: "/compress",
      icon: LiaCompressArrowsAltSolid,
      description: "Reduce file size",
    },
    {
      name: "Resize Image",
      href: "/resize",
      icon: ArrowsPointingOutIcon,
      description: "Change dimensions",
    },
    {
      name: "Crop Image",
      href: "/crop",
      icon: ScissorsIcon,
      description: "Cut out parts",
    },
    {
      name: "Rotate Image",
      href: "/rotate",
      icon: MdOutlineRotate90DegreesCw,
      description: "Flip & rotate",
    },
  ];

  const pdfTools = [
    {
      name: "Image to PDF",
      href: "/image-to-pdf",
      icon: DocumentTextIcon,
      description: "Convert images to PDF",
    },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link href="/">
            <div className="relative w-40 h-14">
              <Image
                src="/logo.png"
                alt="ImageConverter Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Image Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsImageToolsOpen(!isImageToolsOpen)}
                onMouseEnter={() => setIsImageToolsOpen(true)}
                onMouseLeave={() => setIsImageToolsOpen(false)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <span>Image Tools</span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${isImageToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Desktop Dropdown Menu */}
              {isImageToolsOpen && (
                <div
                  onMouseEnter={() => setIsImageToolsOpen(true)}
                  onMouseLeave={() => setIsImageToolsOpen(false)}
                  className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2"
                >
                  {imageTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <tool.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPDFToolsOpen(!isPDFToolsOpen)}
                onMouseEnter={() => setIsPDFToolsOpen(true)}
                onMouseLeave={() => setIsPDFToolsOpen(false)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <span>PDF Tools</span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${isPDFToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Desktop Dropdown Menu */}
              {isPDFToolsOpen && (
                <div
                  onMouseEnter={() => setIsPDFToolsOpen(true)}
                  onMouseLeave={() => setIsPDFToolsOpen(false)}
                  className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2"
                >
                  {pdfTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <tool.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Login Button */}
            <Link
              href="/login"
              className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-103 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                Menu
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Mobile Image Tools */}
            <div className="mb-4">
              <button
                onClick={() =>
                  setIsMobileImageToolsOpen(!isMobileImageToolsOpen)
                }
                className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5" />
                  <span className="font-medium">Image Tools</span>
                </div>
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform ${isMobileImageToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Mobile Image Tools Submenu */}
              {isMobileImageToolsOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  {imageTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                    >
                      <tool.icon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile PDF Tools */}
            <div className="mb-4">
              <button
                onClick={() => setIsMobilePDFToolsOpen(!isMobilePDFToolsOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <DocumentIcon className="w-5 h-5" />
                  <span className="font-medium">PDF Tools</span>
                </div>
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform ${isMobilePDFToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Mobile PDF Tools Submenu */}
              {isMobilePDFToolsOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  {pdfTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                    >
                      <tool.icon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Login Button */}
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full px-4 py-3 text-center font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors mt-4"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Add CSS for extra small screens */}
      <style jsx>{`
        @media (min-width: 480px) {
          .xs\\:block {
            display: block;
          }
        }
      `}</style>
    </header>
  );
}
