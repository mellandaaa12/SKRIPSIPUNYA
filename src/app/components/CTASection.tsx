import React, { useRef, useEffect } from "react";

interface CTASectionProps {
  theme: "dark" | "light";
  onLoginClick?: () => void;
}

export default function CTASection({ theme, onLoginClick }: CTASectionProps) {
  const isDark = theme === "dark";

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  return (
    <section id="cta" style={{
      padding: "120px 32px",
      background: isDark 
        ? "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" 
        : "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: "20%",
        left: "10%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(255,214,0,0.18) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        top: "20%",
        right: "10%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(41,121,255,0.18) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#ffd600", textTransform: "uppercase", letterSpacing: "2px", display: "block", marginBottom: "16px" }}>
          🚀 Siap Memulai?
        </span>
        <h2 style={{
          fontFamily: "Poppins, sans-serif", fontWeight: 800,
          fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
          color: isDark ? "white" : "#0a1f6e",
          margin: "0 0 16px", lineHeight: 1.2, position: "relative", zIndex: 1, textAlign: "center",
        }}>
          Bergabung dan Tingkatkan{" "}
          <span className="text-gradient-yellow">Skill-mu Sekarang!</span>
        </h2>
        <p style={{
          color: isDark ? "rgba(255,255,255,0.72)" : "rgba(10,31,110,0.65)",
          fontFamily: "Nunito, sans-serif", fontSize: "1rem", lineHeight: 1.7,
          maxWidth: "500px", margin: "0 auto 40px", fontWeight: 600, position: "relative", zIndex: 1, textAlign: "center",
        }}>
          Masuk dengan akun yang telah diberikan dan mulai perjalanan belajarmu
          bersama Study With Me hari ini!
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <button
            style={{
              background: "linear-gradient(135deg, #ffd600, #ff6d00)",
              color: "#002171",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 800, fontSize: "1rem",
              padding: "14px 36px", borderRadius: "50px", border: "none",
              cursor: "pointer", transition: "all 0.3s ease",
              boxShadow: "0 8px 30px rgba(255,214,0,0.38)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px) scale(1.05)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0) scale(1)"; }}
            onClick={handleLoginClick}
          >
            Masuk Sekarang 🔑
          </button>
          <button
            style={{
              background: isDark ? "rgba(255,255,255,0.1)" : "rgba(86,182,198,0.1)",
              border: isDark ? "1.5px solid rgba(255,255,255,0.22)" : "1.5px solid rgba(86,182,198,0.22)",
              backdropFilter: "blur(12px)",
              color: isDark ? "white" : "#1565e8",
              fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "1rem",
              padding: "14px 28px", borderRadius: "50px", cursor: "pointer", transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(255,255,255,0.2)" : "rgba(86,182,198,0.18)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(86,182,198,0.1)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            Pelajari Lebih Lanjut
          </button>
        </div>
      </div>
    </section>
  );
}
