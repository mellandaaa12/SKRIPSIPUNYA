import React from "react";

export default function AboutSection() {
  const steps = [
    {
      step: "01",
      emoji: "📝",
      title: "Daftar Akun",
      description: "Buat akun gratis dalam hitungan detik. Cukup email dan nama, kamu sudah bisa mulai belajar.",
      icon: "📝",
      gradient: "from-blue-500 to-cyan-500",
      highlight: "Gratis & Cepat",
      items: ["Email valid", "Nama lengkap", "Pilih jurusan", "Verifikasi"],
    },
    {
      step: "02", 
      emoji: "📚",
      title: "Pilih Materi",
      description: "Pilih pelajaran yang mau dipelajari. Tersedia materi untuk semua jurusan SMK.",
      icon: "📚",
      gradient: "from-purple-500 to-indigo-500",
      highlight: "Lengkap & Terstruktur",
      items: ["Teknik", "Bisnis", "Seni", "Bahasa"],
    },
    {
      step: "03",
      emoji: "🚀",
      title: "Mulai Belajar",
      description: "Langsung mulai belajar dengan modul interaktif, kuis seru, dan dapatkan streak!",
      icon: "🚀",
      gradient: "from-green-500 to-emerald-500",
      highlight: "Interaktif & Menyenangkan",
      items: ["Video pembelajaran", "Kuis interaktif", "Progress tracking", "Badge collection"],
    },
  ];

  const sectionBg = "transparent";

  return (
    <section id="about" style={{
      padding: "120px 32px",
      background: sectionBg,
      position: "relative",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#0077B6", textTransform: "uppercase", letterSpacing: "2px", display: "block", marginBottom: "16px" }}>
            🎯 Cara Kerja
          </span>
          <h2 style={{
            fontFamily: "Poppins, sans-serif", fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            color: "var(--foreground)",
            margin: "0 0 24px", lineHeight: 1.2,
          }}>
            Mulai <span className="text-brand-gradient">Belajar</span> dalam 3 Langkah
          </h2>
          <p style={{
            color: "#4A4A6A",
            fontFamily: "Nunito, sans-serif", fontSize: "1.1rem", lineHeight: 1.7,
            maxWidth: "600px", margin: "0 auto", fontWeight: 600,
          }}>
            Proses pendaftaran yang mudah dan cepat. Kamu bisa langsung mulai belajar dalam beberapa menit.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(0, 180, 216, 0.18)",
                borderRadius: "24px",
                padding: "32px",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 15px 35px rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute",
                top: "16px", left: "16px",
                width: "40px", height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0077B6, #00B4D8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 800,
                fontSize: "0.9rem",
              }}>
                {step.step}
              </div>

              <div style={{
                width: "64px", height: "64px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.9)",
                border: "1.5px solid rgba(0, 180, 216, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
                margin: "0 auto 20px",
              }}>
                {step.icon}
              </div>

              <div style={{
                display: "inline-flex",
                padding: "4px 12px",
                borderRadius: "50px",
                background: "rgba(0, 119, 182, 0.08)",
                border: "1px solid rgba(0, 119, 182, 0.18)",
                marginBottom: "16px",
              }}>
                <span style={{
                  color: "#0077B6",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "0.74rem",
                }}>
                  {step.highlight}
                </span>
              </div>

              <h3 style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "var(--foreground)",
                margin: "0 0 12px",
                lineHeight: 1.3,
                textAlign: "center",
              }}>
                {step.title}
              </h3>
              <p style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#4A4A6A",
                lineHeight: 1.7,
                margin: "0 0 20px",
                textAlign: "center",
              }}>
                {step.description}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                {step.items.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(0, 180, 216, 0.12)",
                      fontSize: "0.75rem",
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 600,
                      color: "#4A4A6A",
                    }}
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
