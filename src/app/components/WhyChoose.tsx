// src/components/WhyChoose.tsx
"use client";

import { useState, useEffect } from "react";
import {
  SwatchIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  ShieldCheckIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion, Variants } from "framer-motion";

export default function WhyChoose() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Properly typed variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const features = [
    {
      icon: SwatchIcon,
      title: "Multiple Formats",
      description: "PNG, JPG, JPEG, WebP, AVIF, PDF, and more",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      stats: "10+ Formats",
    },
    {
      icon: ArrowDownTrayIcon,
      title: "Batch Processing",
      description: "Convert multiple files at once with ease",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      stats: "Unlimited Files",
    },
    {
      icon: PhotoIcon,
      title: "Resize & Optimize",
      description: "Adjust quality, dimensions, and compress images",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      stats: "90% Smaller",
    },
    {
      icon: ShieldCheckIcon,
      title: "100% Private",
      description:
        "Your files never leave your device. No servers, no uploads.",
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      stats: "Client-side",
    },
    {
      icon: BoltIcon,
      title: "Lightning Fast",
      description: "Process images instantly in your browser",
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      stats: "< 1 Second",
    },
    {
      icon: DevicePhoneMobileIcon,
      title: "Mobile Friendly",
      description: "Works perfectly on all devices and screen sizes",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      stats: "Responsive",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 py-16">
      <div className="relative max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full mb-4">
            <SparklesIcon
              aria-hidden="true"
              className="w-4 h-4 text-blue-700 dark:text-blue-300"
            />
            <span className="text-sm font-semibold">
              Why developers love us
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-950 dark:text-white mb-4">
            Everything you need in one place
          </h2>

          <p className="text-lg font-medium text-gray-950 dark:text-white max-w-2xl mx-auto">
            Powerful image processing tools that work entirely in your browser.
            No uploads, no waiting, complete privacy.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="group relative bg-white dark:bg-gray-800 rounded-md p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              {/* Gradient Border on Hover */}
              <div
                className={`absolute inset-0 rounded-md bg-linear-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              <div className="relative">
                {/* Icon with Gradient Background */}
                <div
                  className={`inline-flex p-3 ${feature.bgColor} rounded-md mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon
                    aria-hidden="true"
                    className={`w-6 h-6 ${feature.iconColor}`}
                  />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-2">
                  {feature.title}
                </h3>

                <p className="text-sm font-medium text-gray-950 dark:text-white mb-4">
                  {feature.description}
                </p>

                {/* Stats Badge */}
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-950 dark:text-white bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {feature.stats}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
