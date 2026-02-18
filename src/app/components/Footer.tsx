// src/components/Footer.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import {
  HeartIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const tools = [
    {
      name: "Image Converter",
      href: "/converter",
      description: "Convert between formats",
    },
    {
      name: "Image to PDF",
      href: "/image-to-pdf",
      description: "Create PDF from images",
    },
    {
      name: "Compress Image",
      href: "/compress",
      description: "Reduce file size",
    },
    { name: "Resize Image", href: "/resize", description: "Change dimensions" },
    { name: "Crop Image", href: "/crop", description: "Cut images" },
    { name: "Rotate Image", href: "/rotate", description: "Flip & rotate" },
  ];

  const features = [
    { name: "100% Free", icon: HeartIcon, description: "No hidden costs" },
    {
      name: "Privacy First",
      icon: ShieldCheckIcon,
      description: "Files never leave your device",
    },
    {
      name: "Fast Processing",
      icon: ClockIcon,
      description: "Process in seconds",
    },
    {
      name: "Mobile Friendly",
      icon: DevicePhoneMobileIcon,
      description: "Works on all devices",
    },
  ];

  const socialLinks = [
    {
      href: "https://twitter.com",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
      label: "Twitter",
    },
    {
      href: "https://github.com",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
      label: "GitHub",
    },
    {
      href: "https://linkedin.com",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      label: "LinkedIn",
    },
  ];

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  const featureIconVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
    hover: {
      scale: 1.2,
      rotate: 10,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const linkVariants: Variants = {
    hidden: { x: -10, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
    hover: {
      x: 5,
      transition: {
        type: "spring",
        stiffness: 400,
      },
    },
  };

  const socialIconVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
    hover: {
      scale: 1.2,
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.9,
    },
  };

  const heartVariants: Variants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 2,
      },
    },
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
        >
          {/* Brand Column */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-2"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-50 h-24"
            >
              <Image
                src="/logo.png"
                alt="ImageConverter Logo"
                fill
                className="object-contain"
              />
            </motion.div>
            <motion.p
              variants={itemVariants}
              className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-4"
            >
              Simple, fast, and private. Your files stay on your device. No
              uploads, no servers, complete privacy.
            </motion.p>
            <motion.div variants={itemVariants} className="flex gap-3">
              {features.map((feature) => (
                <motion.div
                  key={feature.name}
                  variants={featureIconVariants}
                  whileHover="hover"
                  className="group relative"
                  title={feature.description}
                >
                  <feature.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-help" />
                  {/* Tooltip */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap pointer-events-none z-10"
                  >
                    {feature.name}: {feature.description}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Tools Column */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-1"
          >
            <motion.h3
              variants={itemVariants}
              className="font-semibold text-gray-900 dark:text-white mb-4"
            >
              Image Tools
            </motion.h3>
            <ul className="space-y-2">
              {tools.slice(0, 6).map((tool) => (
                <motion.li
                  key={tool.href}
                  variants={linkVariants}
                  whileHover="hover"
                >
                  <Link
                    href={tool.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 group"
                  >
                    {tool.name}
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </motion.div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact/Info Column */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-1"
          >
            <motion.h3
              variants={itemVariants}
              className="font-semibold text-gray-900 dark:text-white mb-4"
            >
              Quick Links
            </motion.h3>
            <ul className="space-y-3">
              {[
                "About Us",
                "Privacy Policy",
                "Terms of Service",
                "Contact Us",
              ].map((item, index) => (
                <motion.li
                  key={item}
                  variants={linkVariants}
                  whileHover="hover"
                  custom={index}
                >
                  <Link
                    href={`/${item.toLowerCase().replace(" ", "-")}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-block"
                  >
                    {item}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isVisible ? { scaleX: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="border-t border-gray-200 dark:border-gray-800 my-8 origin-left"
        />

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          {/* Copyright */}
          <motion.p
            whileHover={{ scale: 1.02 }}
            className="text-xs text-gray-500 dark:text-gray-400 text-center md:text-left"
          >
            © {currentYear} ImageConverter. All rights reserved.
            <span className="block sm:inline sm:ml-1">
              Made with{" "}
              <motion.span
                variants={heartVariants}
                initial="initial"
                animate="animate"
                className="inline-block"
              >
                <HeartIcon className="w-3 h-3 inline-block text-red-500 mx-0.5" />
              </motion.span>{" "}
              for the community.
            </span>
          </motion.p>

          {/* Social Links */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="flex items-center gap-4"
          >
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={socialIconVariants}
                whileHover="hover"
                whileTap="tap"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label={social.label}
              >
                {social.icon}
              </motion.a>
            ))}
          </motion.div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <motion.p
            whileHover={{ scale: 1.02 }}
            className="text-xs text-gray-400 dark:text-gray-600"
          >
            🔒 Client-side processing • No file uploads • 100% private • Open
            source
          </motion.p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
