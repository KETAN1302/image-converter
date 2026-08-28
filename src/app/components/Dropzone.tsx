"use client";

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { CloudArrowUpIcon, PhotoIcon } from "@heroicons/react/24/outline";

export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  dragTitle?: string;
  mobileTitle?: string;
  subtitle?: string;
  buttonLabel?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  buttonIcon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;

  // Folder upload support (e.g. for batch converter)
  allowFolderUpload?: boolean;
  onFolderSelected?: (files: File[]) => void;
  folderButtonLabel?: string;
  folderAriaLabel?: string;
}

type DirectoryInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string;
  directory?: string;
};

export default function Dropzone({
  onFilesSelected,
  accept = "image/*",
  multiple = false,
  title,
  dragTitle = "Drop here",
  mobileTitle = "Tap to upload",
  subtitle = "Supports: JPG, PNG, WebP, GIF (Max 50MB)",
  buttonLabel,
  icon: IconComponent = CloudArrowUpIcon,
  buttonIcon,
  ariaLabel,
  className = "",
  allowFolderUpload = false,
  onFolderSelected,
  folderButtonLabel = "Select Folder",
  folderAriaLabel = "Select folder",
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const defaultTitle = multiple ? "Drag & drop your files here" : "Drag & drop here";
  const defaultButtonLabel = multiple ? "Select Files" : "Select Image";
  const resolvedTitle = title || defaultTitle;
  const resolvedButtonLabel = buttonLabel || defaultButtonLabel;
  const resolvedAriaLabel = ariaLabel || (multiple ? "Upload files" : "Upload file");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length === 0) return;

    if (!multiple) {
      onFilesSelected([droppedFiles[0]]);
    } else {
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (!multiple) {
      onFilesSelected([selectedFiles[0]]);
    } else {
      onFilesSelected(selectedFiles);
    }

    if (e.target) {
      e.target.value = "";
    }
  };

  const handleFolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (onFolderSelected) {
      onFolderSelected(selectedFiles);
    }

    if (e.target) {
      e.target.value = "";
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {/* Main Drop Zone Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-full p-6 mb-4 border-3 border-dashed rounded-md
          transition-all duration-300 cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-102 shadow-lg"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-900 hover:shadow-md"
          }
        `}
      >
        <div className="text-center">
          <IconComponent
            aria-hidden="true"
            className={`w-12 h-12 md:w-20 md:h-20 mx-auto mb-2 md:mb-4 transition-all duration-300 ${
              isDragging
                ? "text-blue-500 scale-110"
                : "text-gray-500 dark:text-gray-400"
            }`}
          />

          <p className="text-base md:text-xl font-bold text-gray-950 dark:text-white mb-1 md:mb-2">
            {isDragging ? dragTitle : isMobile ? mobileTitle : resolvedTitle}
          </p>

          {subtitle && (
            <p className="text-xs md:text-sm font-medium text-gray-950 dark:text-white mb-3 md:mb-4">
              {subtitle}
            </p>
          )}

          {/* Action Buttons inside Dropzone */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white text-sm md:text-base font-semibold rounded-md active:bg-blue-700 hover:bg-blue-700 transition-colors shadow-md active:shadow-lg cursor-pointer"
            >
              {buttonIcon !== undefined ? (
                buttonIcon
              ) : multiple ? (
                <PhotoIcon aria-hidden="true" className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
              <span>{resolvedButtonLabel}</span>
            </button>

            {allowFolderUpload && onFolderSelected && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-purple-600 text-white text-sm md:text-base font-semibold rounded-md active:bg-purple-700 hover:bg-purple-700 transition-colors shadow-md active:shadow-lg cursor-pointer"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>{folderButtonLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        aria-label={resolvedAriaLabel}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden Folder Input */}
      {allowFolderUpload && onFolderSelected && (
        <input
          ref={folderInputRef}
          type="file"
          multiple
          aria-label={folderAriaLabel}
          {...({ webkitdirectory: "", directory: "" } as DirectoryInputProps)}
          onChange={handleFolderChange}
          className="hidden"
        />
      )}
    </div>
  );
}
