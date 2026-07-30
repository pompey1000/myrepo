export default function About() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1.25rem",
        gap: "1.5rem",
        minHeight: "60vh",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #00D632, #00e676)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontWeight: 800,
            fontSize: "2rem",
            boxShadow: "0 8px 32px rgba(0, 214, 50, 0.25)",
          }}
        >
          $
        </div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>
          QuickSplit
        </h1>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontSize: "1.15rem",
          color: "#00D632",
          fontWeight: 600,
          textAlign: "center",
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        Split payments, simplified.
      </p>

      {/* Divider */}
      <div style={{ width: "60px", height: "2px", background: "#1a1a1a", borderRadius: "2px" }} />

      {/* Description */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <p
          style={{
            fontSize: "0.95rem",
            color: "#aaa",
            lineHeight: 1.7,
            textAlign: "center",
            margin: 0,
          }}
        >
          QuickSplit makes it effortless to split bills with friends, family, and roommates.
          Send money to multiple people at once — each with a custom amount — so everyone pays
          exactly what they owe. No more awkward math or chasing people down.
        </p>

        {/* Feature highlights */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            marginTop: "0.5rem",
          }}
        >
          <Feature icon="💸" label="Send money to multiple people at once" />
          <Feature icon="✏️" label="Custom amounts for each person" />
          <Feature icon="💳" label="Link debit cards and bank accounts securely" />
          <Feature icon="🏦" label="Withdraw to bank (free) or card (small fee)" />
          <Feature icon="🔒" label="Secured with Stripe — your data is safe" />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "60px", height: "2px", background: "#1a1a1a", borderRadius: "2px" }} />

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "auto",
          paddingTop: "1rem",
        }}
      >
        <a
          href="#terms"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = "#terms";
            window.dispatchEvent(new Event("hashchange"));
          }}
          style={{
            color: "#00D632",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 500,
            transition: "opacity 0.2s",
          }}
        >
          Terms &amp; Conditions
        </a>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#555",
            textAlign: "center",
            margin: 0,
          }}
        >
          Built with ❤️
        </p>
        <p
          style={{
            fontSize: "0.7rem",
            color: "#444",
            textAlign: "center",
            margin: 0,
          }}
        >
          QuickSplit v1.0 — Demo
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.7rem 1rem",
        borderRadius: "12px",
        background: "#141414",
        border: "1px solid #1e1e1e",
      }}
    >
      <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "0.9rem", color: "#ccc", fontWeight: 500 }}>{label}</span>
    </div>
  );
}
