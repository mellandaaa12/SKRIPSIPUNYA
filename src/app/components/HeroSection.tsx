import { motion } from "motion/react";

interface HeroSectionProps {
  onLoginClick?: () => void;
}

export default function HeroSection({ onLoginClick }: HeroSectionProps) {
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  
  return (
    <section id="hero" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "120px 32px 80px",
      position: "relative",
      overflow: "hidden",
      background: "transparent",
    }}>
      
      <div style={{
        maxWidth: "1200px",
        width: "100%",
        margin: "0 auto",
        textAlign: "center",
        position: "relative",
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(16px)",
        padding: "60px 40px",
        borderRadius: "40px",
        boxShadow: "0 20px 40px rgba(3, 4, 94, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.7)",
      }}>

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}>
          <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "#0077B6", textTransform: "uppercase", letterSpacing: "2px", display: "block", marginBottom: "16px", textAlign: "center" }}>
            🚀 Siap Memulai?
          </span>
          <motion.h1
            style={{
              fontFamily: "Poppins, sans-serif", fontWeight: 800,
              fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)",
              margin: "0 0 16px", lineHeight: 1.2, position: "relative", zIndex: 1, textAlign: "center",
              color: "#1A1A2E",
            }}
          >
            Study With Me
          </motion.h1>
          <p style={{
            color: "#4A4A6A",
            fontFamily: "Nunito, sans-serif", fontSize: "1.1rem", lineHeight: 1.7,
            maxWidth: "550px", margin: "0 auto 40px", fontWeight: 600, position: "relative", zIndex: 1,
          }}>
            Masuk dengan akun yang telah diberikan dan mulai perjalanan belajarmu
            bersama Study With Me hari ini!
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
            <button
              style={{
                background: "linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)",
                color: "#FFFFFF",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 800, fontSize: "1rem",
                padding: "14px 36px", borderRadius: "50px", border: "none",
                cursor: "pointer", transition: "all 0.3s ease",
                boxShadow: "0 10px 28px rgba(0, 119, 182, 0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px) scale(1.05)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 34px rgba(0, 119, 182, 0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0) scale(1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 28px rgba(0, 119, 182, 0.25)";
              }}
              onClick={handleLoginClick}
            >
              Masuk Sekarang 🔑
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                border: "2px solid #0077B6",
                color: "#0077B6",
                fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "1rem",
                padding: "14px 28px", borderRadius: "50px", cursor: "pointer", transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#E8F4FD";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.8)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "48px",
          marginTop: "60px",
          flexWrap: "wrap",
        }}>
          {[
            { label: "Modul Belajar", value: "150+", icon: "📝" },
            { label: "Latihan Soal", value: "500+", icon: "✏️" },
            { label: "Mata Pelajaran", value: "20+", icon: "📚" },
          ].map((stat) => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, fontSize: "1.7rem", color: "#1A1A2E", lineHeight: 1 }}>
                {stat.icon} {stat.value}
              </span>
              <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#4A4A6A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          zIndex: 10,
        }}
      >
        <span style={{ color: "#4A4A6A", fontFamily: "Nunito, sans-serif", fontSize: "0.72rem", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "bold" }}>
          Scroll
        </span>
        <div
          style={{
            width: "26px",
            height: "42px",
            borderRadius: "13px",
            border: "2px solid #0077B6",
            display: "flex",
            justifyContent: "center",
            padding: "6px 0",
          }}
        >
          <div style={{
            width: "4px",
            height: "10px",
            borderRadius: "2px",
            background: "#0077B6",
            animation: "floatCloud 1.5s ease-in-out infinite",
          }} />
        </div>
      </div>
    </section>
  );
}
