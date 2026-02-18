// src/components/HeroSection.tsx
"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  SparklesIcon,
  PhotoIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ScissorsIcon,
  ArrowsPointingOutIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { LiaCompressArrowsAltSolid } from "react-icons/lia";
import { MdOutlineRotate90DegreesCw } from "react-icons/md";

export default function HeroSection() {
  const tools = [
    {
      href: "/converter",
      icon: SwatchIcon,
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

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
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

  const badgeVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  };

  const headingVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 8,
      },
    },
  };

  const buttonVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: 0.4,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 py-16 md:py-20">
      {/* Animated Background Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -top-40 -right-40 w-80 h-80 bg-linear-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-linear-to-tr from-green-400/20 to-cyan-400/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-6xl mx-auto px-4">
        {/* New Feature Badge */}
        <motion.div
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6 cursor-default"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Complete Image & PDF Toolkit
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={headingVariants}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Convert & Edit Images{" "}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              className="text-blue-600 inline-block"
            >
              Effortlessly
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8"
          >
            Free, fast, and private. Convert, compress, crop, resize, and rotate
            images. Create PDFs from images. No sign-up required.
          </motion.p>

          {/* Primary Action Buttons */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                href="/converter"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
              >
                <PhotoIcon className="w-5 h-5" />
                Get Started
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              custom={1}
            >
              <Link
                href="/image-to-pdf"
                className="inline-flex items-center gap-2 bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white px-8 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                <DocumentTextIcon className="w-5 h-5" />
                Create PDF
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.href}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 10 },
                }}
                whileTap={{ scale: 0.98 }}
                custom={index}
              >
                <Link
                  href={tool.href}
                  className="group relative block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.1 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute inset-0`}
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </motion.div>
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </motion.div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {tool.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.description}
                    </p>

                    {/* Animated underline */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                      className={`absolute bottom-0 left-0 h-0.5`}
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
