import Header from "./components/Header";
import Footer from "./components/Footer";
import HeroSection from "./components/HeroSection";
import ToolsGrid from "./components/ToolGrid";
import WhyChoose from "./components/WhyChoose";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Header />
      <HeroSection />
      <ToolsGrid />
      <WhyChoose />
      <Footer />
    </main>
  );
}
