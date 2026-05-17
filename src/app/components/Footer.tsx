import React from "react";

export default function Footer() {

  const footerLinks = {
    "Platform": [
      { label: "Beranda", href: "#" },
      { label: "Fitur", href: "#" },
      { label: "Tentang", href: "#" },
    ],
    "Pengguna": [
      { label: "Admin", href: "#" },
      { label: "Guru", href: "#" },
      { label: "Siswa", href: "#" },
      { label: "Login", href: "#" },
    ],
    "Bantuan": [
      { label: "FAQ", href: "#" },
      { label: "Panduan", href: "#" },
      { label: "Kontak", href: "#" },
      { label: "Kebijakan Privasi", href: "#" },
    ],
  };

  return (
    <footer style={{
      background: "rgba(255, 255, 255, 0.5)",
      backdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(0, 180, 216, 0.16)",
      color: "var(--foreground)",
      padding: "60px 32px 32px",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "48px", 
          marginBottom: "48px" 
        }}>
          {/* Brand Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div>
                <h2
                  className="text-brand-gradient"
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 900, fontSize: "1.8rem", margin: "0 0 4px", letterSpacing: "-0.5px" }}
                >
                  Study With Me
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand-700)", boxShadow: "0 0 10px rgba(0, 180, 216, 0.55)" }} />
                  <span style={{ color: "var(--foreground)", fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "0.8rem" }}>
                    Platform Belajar SMK
                  </span>
                </div>
              </div>
            </div>
            <p style={{ color: "#64748B", fontFamily: "Nunito, sans-serif", fontSize: "0.9rem", lineHeight: 1.8, maxWidth: "280px", fontWeight: 500, margin: "0 0 24px" }}>
              Platform pembelajaran eksklusif untuk ekosistem SMK — siswa, guru, dan admin
              dalam satu sistem yang terintegrasi.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              {["📷", "🐦", "📘", "▶️"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={{ 
                    width: "40px", height: "40px", borderRadius: "12px", 
                    color: "var(--foreground)", 
                    border: "1px solid rgba(255,255,255,0.15)", 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    fontSize: "18px", textDecoration: "none", transition: "all 0.2s ease" 
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.2)";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--foreground)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.1)";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 style={{ 
                fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "1rem", 
                color: "var(--foreground)", margin: "0 0 20px" 
              }}>
                {title}
              </h3>
              <ul style={{ 
                listStyle: "none", padding: 0, margin: 0, 
                display: "flex", flexDirection: "column", gap: "12px" 
              }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      style={{ 
                        color: "var(--foreground)", 
                        fontFamily: "Nunito, sans-serif", fontSize: "0.9rem", 
                        fontWeight: 600, textDecoration: "none", transition: "all 0.2s ease" 
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--brand-700)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--foreground)";
                        (e.currentTarget as HTMLAnchorElement).style.paddingLeft = "0";
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div style={{ 
          borderTop: "1px solid rgba(0,119,182,0.2)", 
          paddingTop: "28px", 
          display: "flex", justifyContent: "space-between", 
          alignItems: "center", flexWrap: "wrap", gap: "16px" 
        }}>
          <p style={{ 
            color: "#334155", 
            fontFamily: "Nunito, sans-serif", fontSize: "0.85rem", 
            fontWeight: 500, margin: 0 
          }}>
            © {new Date().getFullYear()} Study With Me · Dibuat dengan ❤️ untuk siswa SMK
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {["✉️ hello@studywithme.id", "📍 Indonesia"].map((item, i) => (
              <span
                key={i}
                style={{ 
                  color: "#64748B", 
                  fontFamily: "Nunito, sans-serif", fontSize: "0.82rem", 
                  fontWeight: 500, padding: "4px 12px", borderRadius: "50px", 
                  background: "rgba(0,119,182,0.08)", 
                  border: "1px solid rgba(0,119,182,0.15)" 
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
