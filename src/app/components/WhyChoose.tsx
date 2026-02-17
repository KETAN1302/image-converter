import {
  SwatchIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

export default function WhyChoose() {
  return (
    <section>
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
    </section>
  );
}
