"use client";

import React from "react";
import Link from "next/link";
import { ChevronsLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export interface ToolHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  gradient?: string;
  className?: string;
}

export default function ToolHeader({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Back to Home",
  gradient = "from-blue-600 to-cyan-600",
  className = "",
}: ToolHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-4 py-3 ${className}`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 md:gap-4">
        {/* Left: Back icon + Title & Subtitle */}
        <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0">
          <Link
            href={backHref}
            aria-label={backLabel}
            title={backLabel}
            className="p-1.5 md:p-2 rounded-md text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 flex items-center justify-center"
          >
            <ChevronsLeft className="w-7 h-7 md:w-8 md:h-8" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className={`text-lg sm:text-xl md:text-2xl font-bold bg-linear-to-r ${gradient} bg-clip-text text-transparent truncate`}
              >
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="font-medium text-xs md:text-sm text-gray-950 dark:text-white truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center shrink-0">
          <ThemeToggle
            className="p-1.5 md:p-2"
            iconClassName="w-6 h-6 md:w-7 md:h-7"
          />
        </div>
      </div>
    </div>
  );
}
