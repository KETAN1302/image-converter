import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const SITE_URL = "https://image-converter-six-beta.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Image Converter - Free All-in-One Online Image & PDF Tools",
    template: "%s | Image Converter",
  },
  description:
    "Fast, secure, and free online image tools. Convert formats (JPG, PNG, WebP, AVIF, SVG, ICO), remove backgrounds with AI, upscale, blur & censor, compress, resize, crop, and convert PDF to images directly in your browser.",
  applicationName: "Image Converter",
  authors: [{ name: "Image Converter Team", url: SITE_URL }],
  generator: "Next.js",
  keywords: [
    "image converter",
    "online image converter",
    "convert jpg to png",
    "convert png to webp",
    "convert avif to jpg",
    "remove background",
    "ai background remover",
    "upscale image",
    "ai image enhancer",
    "blur image",
    "censor faces",
    "blur number plates",
    "censor text",
    "compress image",
    "reduce image size",
    "resize image",
    "crop image",
    "rotate image",
    "flip image",
    "image to ico",
    "favicon generator",
    "image to pdf",
    "pdf to image",
    "free image editor",
    "browser image tools",
  ],
  creator: "Image Converter",
  publisher: "Image Converter",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Image Converter",
    title: "Image Converter - Free All-in-One Online Image & PDF Tools",
    description:
      "Convert formats, remove backgrounds with AI, upscale, blur & censor, compress, resize, crop, and convert PDF to images directly in your browser with 100% privacy.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Image Converter - Free All-in-One Online Image & PDF Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Converter - Free All-in-One Online Image & PDF Tools",
    description:
      "Free online image converter, AI background remover, upscaler, blur & privacy tools, and PDF converter.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
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
