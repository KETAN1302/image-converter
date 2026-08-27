"use client";

import { useSyncExternalStore, useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return storedTheme === "dark" || (!storedTheme && prefersDark);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nextDark = !prev;
      if (nextDark) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return nextDark;
    });
  };

  if (!mounted) {
    return <div className={`w-9 h-9 ${className}`} aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-hidden cursor-pointer flex items-center justify-center ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 text-amber-400" aria-hidden="true" />
      ) : (
        <MoonIcon className="w-5 h-5 text-gray-950 dark:text-white" aria-hidden="true" />
      )}
    </button>
  );
}
