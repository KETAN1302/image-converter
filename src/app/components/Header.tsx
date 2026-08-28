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
  SparklesIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { LiaCompressArrowsAltSolid } from "react-icons/lia";
import { MdOutlineRotate90DegreesCw } from "react-icons/md";
import ThemeToggle from "./ThemeToggle";

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
      href: "/converter",
      icon: SwatchIcon,
    },
    {
      name: "Remove Background",
      href: "/remove-background",
      icon: SparklesIcon,
    },
    {
      name: "Upscale Image",
      href: "/upscale",
      icon: SparklesIcon,
    },
    {
      name: "Blur & Censor",
      href: "/blur-image",
      icon: EyeSlashIcon,
    },
    {
      name: "Compress Image",
      href: "/compress",
      icon: LiaCompressArrowsAltSolid,
    },
    {
      name: "Resize Image",
      href: "/resize",
      icon: ArrowsPointingOutIcon,
    },
    {
      name: "Crop Image",
      href: "/crop",
      icon: ScissorsIcon,
    },
    {
      name: "Rotate Image",
      href: "/rotate",
      icon: MdOutlineRotate90DegreesCw,
    },
    {
      name: "Image to ICO",
      href: "/image-to-ico",
      icon: PhotoIcon,
    },
  ];

  const pdfTools = [
    {
      name: "Image to PDF",
      href: "/image-to-pdf",
      icon: DocumentTextIcon,
    },
    {
      name: "PDF to Image",
      href: "/pdf-to-image",
      icon: PhotoIcon,
    },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Left: Logo & Tools Navigation */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Logo Section */}
            <Link href="/" className="shrink-0">
              <div className="relative w-20 h-10">
                <Image
                  src="/logo.jpg"
                  alt="ImageConverter Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation (Next to Logo) */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Image Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsImageToolsOpen(!isImageToolsOpen)}
                  onMouseEnter={() => setIsImageToolsOpen(true)}
                  onMouseLeave={() => setIsImageToolsOpen(false)}
                  aria-expanded={isImageToolsOpen}
                  aria-haspopup="true"
                  aria-label="Image Tools Menu"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
                >
                  <span>Image Tools</span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={`w-4 h-4 transition-transform ${isImageToolsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Desktop Dropdown Menu: 2 Columns without description */}
                {isImageToolsOpen && (
                  <div
                    onMouseEnter={() => setIsImageToolsOpen(true)}
                    onMouseLeave={() => setIsImageToolsOpen(false)}
                    role="menu"
                    className="absolute top-full left-0 mt-1 w-[450px] bg-white dark:bg-gray-900 rounded-md shadow-xl border border-gray-200 dark:border-gray-800 p-2 animate-in fade-in slide-in-from-top-2 z-50"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {imageTools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors group"
                        >
                          <tool.icon
                            aria-hidden="true"
                            className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0"
                          />
                          <span className="truncate">{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsPDFToolsOpen(!isPDFToolsOpen)}
                  onMouseEnter={() => setIsPDFToolsOpen(true)}
                  onMouseLeave={() => setIsPDFToolsOpen(false)}
                  aria-expanded={isPDFToolsOpen}
                  aria-haspopup="true"
                  aria-label="PDF Tools Menu"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer"
                >
                  <span>PDF Tools</span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={`w-4 h-4 transition-transform ${isPDFToolsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Desktop Dropdown Menu */}
                {isPDFToolsOpen && (
                  <div
                    onMouseEnter={() => setIsPDFToolsOpen(true)}
                    onMouseLeave={() => setIsPDFToolsOpen(false)}
                    role="menu"
                    className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-900 rounded-md shadow-xl border border-gray-200 dark:border-gray-800 p-2 animate-in fade-in slide-in-from-top-2 z-50 space-y-1"
                  >
                    {pdfTools.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors group"
                      >
                        <tool.icon
                          aria-hidden="true"
                          className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0"
                        />
                        <span className="truncate">{tool.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Desktop Theme Toggle & Get Started Button */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/converter"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {/* Mobile Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon
                  aria-hidden="true"
                  className="w-6 h-6 text-gray-950 dark:text-white"
                />
              ) : (
                <Bars3Icon
                  aria-hidden="true"
                  className="w-6 h-6 text-gray-950 dark:text-white"
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
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
              <span className="font-bold text-lg text-gray-950 dark:text-white">
                Menu
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close navigation menu"
            >
              <XMarkIcon
                aria-hidden="true"
                className="w-5 h-5 text-gray-950 dark:text-white"
              />
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
                aria-expanded={isMobileImageToolsOpen}
                aria-label="Toggle Image Tools Menu"
                className="flex items-center justify-between w-full px-4 py-3 text-left font-semibold text-gray-950 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PhotoIcon
                    aria-hidden="true"
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  />
                  <span className="font-semibold text-gray-950 dark:text-white">
                    Image Tools
                  </span>
                </div>
                <ChevronDownIcon
                  aria-hidden="true"
                  className={`w-5 h-5 transition-transform ${isMobileImageToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Mobile Image Tools Submenu: 2 columns without description */}
              {isMobileImageToolsOpen && (
                <div className="mt-2 grid grid-cols-2 gap-1.5 p-1">
                  {imageTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors"
                    >
                      <tool.icon
                        aria-hidden="true"
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                      />
                      <span className="truncate">{tool.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile PDF Tools */}
            <div className="mb-4">
              <button
                onClick={() => setIsMobilePDFToolsOpen(!isMobilePDFToolsOpen)}
                aria-expanded={isMobilePDFToolsOpen}
                aria-label="Toggle PDF Tools Menu"
                className="flex items-center justify-between w-full px-4 py-3 text-left font-semibold text-gray-950 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <DocumentIcon
                    aria-hidden="true"
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  />
                  <span className="font-semibold text-gray-950 dark:text-white">
                    PDF Tools
                  </span>
                </div>
                <ChevronDownIcon
                  aria-hidden="true"
                  className={`w-5 h-5 transition-transform ${isMobilePDFToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Mobile PDF Tools Submenu: 2 columns without description */}
              {isMobilePDFToolsOpen && (
                <div className="mt-2 grid grid-cols-2 gap-1.5 p-1">
                  {pdfTools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition-colors"
                    >
                      <tool.icon
                        aria-hidden="true"
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                      />
                      <span className="truncate">{tool.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Theme Toggle Row */}
            <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-2">
              <span className="font-semibold text-sm text-gray-950 dark:text-white">
                Theme
              </span>
              <ThemeToggle />
            </div>

            {/* Mobile Login Button */}
            <Link
              href="/converter"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full px-4 py-3 text-center font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors mt-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
