import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Converter - Convert Images to PDF & More",
  description:
    "Fast and reliable online image converter. Convert images to PDF, change image formats, compress images, and more with our easy-to-use tools.",
  keywords: ["image converter", "image to pdf", "converter", "online tool"],
  authors: [{ name: "Image Converter" }],
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
