import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import WhyChoose from "./components/WhyChoose";

export const metadata: Metadata = {
  title: "Home - Image Converter",
  description:
    "Convert images to PDF, change formats, and compress images with our free online tools. No installation needed.",
  openGraph: {
    title: "Image Converter - Convert Images to PDF & More",
    description: "Fast and reliable image conversion tools for your needs.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Header />
      <HeroSection />
      <WhyChoose />
      <Footer />
    </main>
  );
}
