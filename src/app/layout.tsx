import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Image Converter - Convert Images to PDF & More",
  description:
    "Fast and reliable online image converter. Convert images to PDF, change image formats, compress images, and more with our easy-to-use tools.",
  keywords: [
    "image converter",
    "image to pdf",
    "image to ico",
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
    <html lang="en" suppressHydrationWarning className={montserrat.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
