import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import MarqueeSection from "../components/MarqueeSection";
import FeaturesSection from "../components/FeaturesSection";
import SubjectsSection from "../components/SubjectsSection";
import AboutSection from "../components/AboutSection";
import Footer from "../components/Footer";

export default function LandingPage() {
  const navigate = useNavigate();
  const [theme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  }, [theme]);

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1100px 680px at 50% -10%, rgba(202, 240, 248, 0.95) 0%, rgba(144, 224, 239, 0.55) 42%, rgba(255, 255, 255, 1) 78%), linear-gradient(135deg, rgba(0, 119, 182, 0.03) 0%, rgba(255, 255, 255, 1) 100%)",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Decorative background blobs spanning all the way down the page */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {/* Blob 1 - Top Right near Navbar & Hero */}
        <div style={{ position: "absolute", top: "1%", right: "2%", width: "520px", height: "520px", borderRadius: "50%", background: "rgba(0, 119, 182, 0.45)", filter: "blur(110px)" }} />
        {/* Blob 1b - Top Left Accenting the Navbar */}
        <div style={{ position: "absolute", top: "0%", left: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(144, 224, 239, 0.45)", filter: "blur(90px)" }} />
        {/* Blob 2 - Hero Left */}
        <div style={{ position: "absolute", top: "12%", left: "-8%", width: "550px", height: "550px", borderRadius: "50%", background: "rgba(0, 180, 216, 0.38)", filter: "blur(120px)" }} />
        {/* Blob 3 - Features Section Right */}
        <div style={{ position: "absolute", top: "35%", right: "-8%", width: "550px", height: "550px", borderRadius: "50%", background: "rgba(144, 224, 239, 0.35)", filter: "blur(130px)" }} />
        {/* Blob 4 - Subjects Section Left */}
        <div style={{ position: "absolute", top: "55%", left: "-5%", width: "480px", height: "480px", borderRadius: "50%", background: "rgba(0, 119, 182, 0.24)", filter: "blur(110px)" }} />
        {/* Blob 5 - About Section Right */}
        <div style={{ position: "absolute", top: "75%", right: "5%", width: "520px", height: "520px", borderRadius: "50%", background: "rgba(144, 224, 239, 0.32)", filter: "blur(120px)" }} />
        {/* Blob 6 - Bottom Left near Footer */}
        <div style={{ position: "absolute", top: "90%", left: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(0, 119, 182, 0.22)", filter: "blur(100px)" }} />
      </div>

      <Navbar onLoginClick={handleLoginClick} />
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection onLoginClick={handleLoginClick} />
        <MarqueeSection />
        <FeaturesSection theme={theme} />
        <SubjectsSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
