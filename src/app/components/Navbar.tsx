import { useState, useEffect } from "react";

interface NavbarProps {
  onLoginClick?: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { label: "Beranda", id: "hero" },
    { label: "Fitur", id: "features" },
    { label: "Tentang", id: "about" },
  ];

  const navBg = scrolled
    ? "rgba(255, 255, 255, 0.95)"
    : "rgba(255, 255, 255, 0.85)";

  const linkColor = "var(--foreground)";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        background: navBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: scrolled
          ? "1px solid rgba(0, 180, 216, 0.18)"
          : "none",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          height: "68px",
          gap: "8px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginRight: "auto" }}>
        </div>

        {/* Nav Links - Desktop */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              style={{
                color: linkColor,
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                padding: "8px 16px",
                borderRadius: "12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 119, 182, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Login Button */}
        <div>
          <button
            style={{
              background:
                "linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 55%, var(--brand-400) 100%)",
              color: "#FFFFFF",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 800, fontSize: "0.9rem",
              padding: "10px 24px", borderRadius: "12px", border: "none",
              cursor: "pointer", transition: "all 0.3s ease",
              boxShadow: "0 10px 28px rgba(3, 4, 94, 0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(3, 4, 94, 0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 28px rgba(3, 4, 94, 0.2)";
            }}
            onClick={handleLoginClick}
          >
            Masuk 🔑
          </button>
        </div>
      </div>
    </header>
  );
}
