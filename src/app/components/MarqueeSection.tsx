const items = [
  { icon: "💻", label: "Pemrograman Web" },
  { icon: "🗄️", label: "Basis Data" },
  { icon: "🔧", label: "Jaringan Komputer" },
  { icon: "🎨", label: "Desain Grafis" },
  { icon: "🤖", label: "Kecerdasan Buatan" },
  { icon: "📊", label: "Akuntansi Digital" },
  { icon: "📐", label: "Matematika Teknik" },
  { icon: "🏭", label: "Teknik Manufaktur" },
  { icon: "🌐", label: "Digital Marketing" },
  { icon: "📱", label: "Mobile Development" },
];

export default function MarqueeSection() {
  const doubled = [...items, ...items];

  return (
    <div
      style={{
        background: "transparent",
        borderTop: "1px solid rgba(0, 180, 216, 0.16)",
        borderBottom: "1px solid rgba(0, 180, 216, 0.16)",
        padding: "18px 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      
      <div
        className="animate-marquee"
        style={{ display: "flex", gap: "32px", width: "max-content" }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "7px 18px",
              borderRadius: "50px",
              background: "rgba(255, 255, 255, 0.55)",
              border: "1px solid rgba(0, 180, 216, 0.16)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "17px" }}>{item.icon}</span>
            <span style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "var(--brand-900)",
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
