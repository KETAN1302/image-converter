import Link from "next/link";
import {
  ArrowRightIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  SwatchIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PhotoIcon className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">ImageConverter</span>
          </div>
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
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
          <SparklesIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-600 font-medium">
            New: PDF Tools Added!
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Convert Images & PDFs
          <span className="text-blue-600"> Instantly</span>
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Free, fast, and private. Convert between images and PDF formats. No
          sign-up required.
        </p>

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
      </div>

      {/* Tools Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          All Tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Converter */}
          <Link href="/coverter" className="group">
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PhotoIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Image Converter
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Convert between PNG, JPG, WebP, AVIF, and GIF
              </p>
              <span className="text-sm text-blue-600 font-medium group-hover:gap-2 inline-flex items-center gap-1">
                Try now <ArrowRightIcon className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* Image to PDF */}
          <Link href="/image-to-pdf" className="group">
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Image to PDF
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Convert multiple images to a single PDF document
              </p>
              <span className="text-sm text-green-600 font-medium group-hover:gap-2 inline-flex items-center gap-1">
                Try now <ArrowRightIcon className="w-3 h-3" />
              </span>
            </div>
          </Link>

          {/* PDF to Image */}
          <Link href="/pdf-to-image" className="group">
            <div className="p-6 bg-white border border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DocumentArrowUpIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                PDF to Image
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Extract pages from PDF as JPG, PNG, or WebP
              </p>
              <span className="text-sm text-purple-600 font-medium group-hover:gap-2 inline-flex items-center gap-1">
                Try now <ArrowRightIcon className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Why Choose Us
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <SwatchIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Multiple Formats</h3>
            <p className="text-sm text-gray-500">
              PNG, JPG, WebP, AVIF, GIF, PDF
            </p>
          </div>

          <div className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <ArrowDownTrayIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Batch Processing</h3>
            <p className="text-sm text-gray-500">
              Convert multiple files at once
            </p>
          </div>

          <div className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <PhotoIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">
              Resize & Optimize
            </h3>
            <p className="text-sm text-gray-500">
              Adjust quality and dimensions
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-2xl p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">5+</div>
            <div className="text-xs text-gray-500">Image Formats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">PDF</div>
            <div className="text-xs text-gray-500">Document Support</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">∞</div>
            <div className="text-xs text-gray-500">No Limits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">100%</div>
            <div className="text-xs text-gray-500">Private</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 py-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 text-center md:text-left">
            Simple, fast, and private. Your files stay on your device.
          </p>
          <div className="flex gap-4">
            <Link
              href="/coverter"
              className="text-xs text-gray-500 hover:text-blue-600"
            >
              Image Converter
            </Link>
            <Link
              href="/image-to-pdf"
              className="text-xs text-gray-500 hover:text-green-600"
            >
              Image to PDF
            </Link>
            <Link
              href="/pdf-to-image"
              className="text-xs text-gray-500 hover:text-purple-600"
            >
              PDF to Image
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
