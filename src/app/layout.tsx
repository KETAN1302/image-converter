import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Converter - Convert Images to PDF & More",
  description:
    "Fast and reliable online image converter. Convert images to PDF, change image formats, compress images, and more with our easy-to-use tools.",
  keywords: [
    "image converter",
    "image to pdf",
    "converter",
    "online tool",
    "crop image",
    "resize image",
    "rotate image",
    "compressed image",
  ],
  authors: [{ name: "Image Converter" }],
  robots: "index, follow",

  openGraph: {
    title: "Image Converter - Convert Images to PDF & More",
    description:
      "Fast and reliable online image converter. Convert images to PDF, change image formats, compress images, and more.",
    url: "https://yourdomain.com",
    siteName: "Image Converter",
    images: [
      {
        url: "https://yourdomain.com/og-image.png", // absolute URL required
        width: 1200,
        height: 630,
        alt: "Image Converter Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Image Converter - Convert Images to PDF & More",
    description:
      "Fast and reliable online image converter. Convert images, compress, crop, resize, and more.",
    images: ["https://yourdomain.com/og-image.png"],
  },
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
