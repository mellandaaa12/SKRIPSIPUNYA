import React from "react";

interface FeaturesSectionProps {
  theme: "dark" | "light";
}

export default function FeaturesSection({ theme }: FeaturesSectionProps) {
  const isDark = theme === "dark";

  const features = [
    {
      icon: "🧠",
      title: "Belajar Interaktif",
      description: "Modul mini dengan kuis visual yang seru. Belajar semudah main game — tidak membosankan!",
      color: "#6c42f5",
      tag: "Fitur Andalan",
      glow: "rgba(108,66,245,0.3)",
    },
    {
      icon: "🔥",
      title: "Streak Harian",
      description: "Sistem streak yang membuat kamu konsisten belajar setiap hari. Makin panjang streak, makin seru!",
      color: "#00d2ff",
      tag: "Konsistensi",
      glow: "rgba(0,210,255,0.3)",
    },
    {
      icon: "👥",
      title: "Komunitas Pelajar",
      description: "Diskusi dan tanya jawab bareng pelajar SMK se-Indonesia. Belajar bareng jauh lebih seru!",
      color: "#ff6b9d",
      tag: "Kolaborasi",
      glow: "rgba(255,107,157,0.3)",
    },
    {
      icon: "🏆",
      title: "Leaderboard & Badge",
      description: "Saingan sehat dengan leaderboard kelas dan sekolah. Kumpulkan badge dan tunjukkan skill-mu!",
      color: "#ff9500",
      tag: "Gamifikasi",
      glow: "rgba(255,149,0,0.3)",
    },
    {
      icon: "⚡",
      title: "Materi Padat & Jelas",
      description: "Rangkuman materi SMK yang to the point, lengkap dengan ilustrasi dan contoh soal nyata.",
      color: "#ffd60a",
      tag: "Efisien",
      glow: "rgba(255,214,0,0.3)",
    },
    {
      icon: "🚀",
      title: "Simulasi Ujian",
      description: "Latihan soal UTS, UAS, dan Ujian Kompetensi Keahlian. Tampil percaya diri saat ujian tiba!",
      color: "#00e676",
      tag: "Persiapan",
      glow: "rgba(0,230,118,0.3)",
    },
  ];

  const cardBg = "rgba(255,255,255,0.9)";
  const cardBorder = "1px solid rgba(0, 180, 216, 0.18)";
  const cardTitleColor = "var(--foreground)";
  const cardDescColor = "#64748B";

  return (
    <section id="features" style={{
      padding: "120px 32px",
      background: "transparent",
      position: "relative",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#0077B6", textTransform: "uppercase", letterSpacing: "2px", display: "block", marginBottom: "16px" }}>
            ✨ Fitur Unggulan
          </span>
          <h2 style={{
            fontFamily: "Poppins, sans-serif", fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            color: "var(--foreground)",
            margin: "0 0 24px", lineHeight: 1.2,
          }}>
            Kenapa Memilih <span className="text-brand-gradient">Study With Me</span>?
          </h2>
          <p style={{
            color: "#64748B",
            fontFamily: "Nunito, sans-serif", fontSize: "1.1rem", lineHeight: 1.7,
            maxWidth: "600px", margin: "0 auto", fontWeight: 600,
          }}>
            Platform pembelajaran SMK dengan fitur-fitur modern yang membuat belajar lebih efektif dan menyenangkan.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "32px" }}>
          {features.map((feat, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                backdropFilter: "blur(12px)",
                border: cardBorder,
                borderRadius: "24px",
                padding: "32px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.95)";
                e.currentTarget.style.transform = "translateY(-10px) scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = cardBg;
                e.currentTarget.style.transform = "translateY(0) scale(1)";
              }}
            >
              <div style={{
                display: "inline-flex",
                padding: "3px 12px",
                borderRadius: "50px",
                background: `${feat.color}18`,
                border: `1px solid ${feat.color}38`,
                marginBottom: "12px",
              }}>
                <span style={{
                  color: feat.color,
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "0.74rem",
                }}>
                  {feat.tag}
                </span>
              </div>

              <div style={{
                width: "64px", height: "64px",
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${feat.color}30, ${feat.color}12)`,
                border: `1.5px solid ${feat.color}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
                boxShadow: `0 8px 24px ${feat.glow}`,
              }}>
                {feat.icon}
              </div>

              <div style={{
                position: "absolute",
                top: "28px", right: "28px",
                width: "36px", height: "36px",
                borderRadius: "50%",
                background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0, 180, 216, 0.08)",
                border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0, 180, 216, 0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0, 180, 216, 0.65)",
                fontSize: "16px",
              }}>
                ↗
              </div>

              <h3 style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "1.12rem",
                color: cardTitleColor,
                margin: "0 0 12px",
                lineHeight: 1.3,
              }}>
                {feat.title}
              </h3>
              <p style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: cardDescColor,
                lineHeight: 1.7,
                margin: 0,
              }}>
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
