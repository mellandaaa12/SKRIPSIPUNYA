import { useState } from "react";

export default function SubjectsSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  const subjects = [
    {
      icon: "💻",
      title: "Teknik Komputer & Jaringan",
      desc: "Pelajari pemrograman, jaringan, dan perakitan komputer dari dasar hingga mahir.",
      tag: "TKJ",
      iconBg: "rgba(108,66,245,0.08)",
      iconBorder: "rgba(108,66,245,0.18)",
      accentColor: "#6c42f5",
    },
    {
      icon: "📊",
      title: "Akuntansi",
      desc: "Kuasai pembukuan, laporan keuangan, dan software akuntansi modern.",
      tag: "AK",
      iconBg: "rgba(0,210,255,0.08)",
      iconBorder: "rgba(0,210,255,0.18)",
      accentColor: "#00d2ff",
    },
    {
      icon: "🎨",
      title: "Multimedia",
      desc: "Eksplorasi desain grafis, animasi, dan editing video profesional.",
      tag: "MM",
      iconBg: "rgba(255,107,157,0.08)",
      iconBorder: "rgba(255,107,157,0.18)",
      accentColor: "#ff6b9d",
    },
    {
      icon: "⚙️",
      title: "Teknik Mesin",
      desc: "Belajar gambar teknik, CNC, dan perawatan mesin industri.",
      tag: "TM",
      iconBg: "rgba(255,149,0,0.08)",
      iconBorder: "rgba(255,149,0,0.18)",
      accentColor: "#ff9500",
    },
  ];

  const sectionBg = "transparent";

  return (
    <section id="subjects" style={{
      padding: "120px 32px",
      background: sectionBg,
      position: "relative",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#0077B6", textTransform: "uppercase", letterSpacing: "2px", display: "block", marginBottom: "16px" }}>
            📚 Jurusan Unggulan
          </span>
          <h2 style={{
            fontFamily: "Poppins, sans-serif", fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            color: "var(--foreground)",
            margin: "0 0 24px", lineHeight: 1.2,
          }}>
            Pilih <span className="text-brand-gradient">Jurusanmu</span>
          </h2>
          <p style={{
            color: "#4A4A6A",
            fontFamily: "Nunito, sans-serif", fontSize: "1.1rem", lineHeight: 1.7,
            maxWidth: "600px", margin: "0 auto", fontWeight: 600,
          }}>
            Materi pembelajaran lengkap untuk semua jurusan SMK favorit di Indonesia.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {subjects.map((subj, i) => {
            const isActive = i === activeIdx;
            return (
              <div
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  border: isActive 
                    ? `2.5px solid ${subj.accentColor}`
                    : "1.5px solid rgba(0, 180, 216, 0.18)",
                  borderRadius: "20px",
                  padding: "28px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{
                    width: "56px", height: "56px",
                    borderRadius: "16px",
                    background: subj.iconBg,
                    border: `1.5px solid ${subj.iconBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "28px",
                  }}>
                    {subj.icon}
                  </div>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.6)",
                    border: "1px solid rgba(0, 180, 216, 0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "15px",
                    color: subj.accentColor,
                  }}>
                    ↗
                  </div>
                </div>

                <div style={{
                  display: "inline-flex",
                  padding: "3px 12px",
                  borderRadius: "50px",
                  background: `${subj.accentColor}12`,
                  border: `1px solid ${subj.accentColor}30`,
                  marginBottom: "12px",
                }}>
                  <span style={{
                    color: subj.accentColor,
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 800,
                    fontSize: "0.74rem",
                  }}>
                    {subj.tag}
                  </span>
                </div>

                <h3 style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: "var(--foreground)",
                  margin: "0 0 10px",
                  lineHeight: 1.3,
                }}>
                  {subj.title}
                </h3>
                <p style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#4A4A6A",
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {subj.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "32px", padding: "0 32px" }}>
          {subjects.map((subj, i) => (
            <div
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                width: i === activeIdx ? "28px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: i === activeIdx ? subj.accentColor : "rgba(0, 180, 216, 0.22)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
