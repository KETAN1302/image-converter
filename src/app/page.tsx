import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import WhyChoose from "./components/WhyChoose";

export const metadata: Metadata = {
  title: "Free All-in-One Online Image & PDF Tools",
  description:
    "Convert formats, remove backgrounds with AI, upscale, blur faces & text, compress, resize, crop, and convert PDF to images directly in your browser with 100% privacy.",
  openGraph: {
    title: "Image Converter - Free All-in-One Online Image & PDF Tools",
    description:
      "Fast, secure, and free online tools to convert, edit, and enhance images and PDFs.",
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
