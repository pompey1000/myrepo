import { useState, useEffect } from "react";

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarColor(name) {
  const colors = [
    "#00D632", "#00bcd4", "#ff6d00", "#7c4dff",
    "#ff4081", "#40c4ff", "#b2ff59", "#ffab40",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "?").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function SendConfirmation() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("sendConfirm");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(null);
      }
    }
  }, []);

  function navigateTo(hash) {
    window.location.hash = hash;
    window.dispatchEvent(new Event("hashchange"));
  }

  if (!data || !data.payment) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 1.5rem",
          gap: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#888", fontSize: "0.95rem" }}>
          No payment data found. Go back and try sending again.
        </div>
        <button
          onClick={() => navigateTo("#send")}
          style={{
            padding: "0.85rem 2rem",
            borderRadius: "50px",
            border: "none",
            background: "#00D632",
            color: "#000",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          Go to Send Money
        </button>
      </div>
    );
  }

  const { payment } = data;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem 1.25rem",
        gap: "1.25rem",
        textAlign: "center",
      }}
    >
      {/* Success checkmark */}
      <div
        style={{
          width: "88px",
          height: "88px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00D632, #00e676)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.8rem",
          color: "#000",
          marginTop: "1.5rem",
          boxShadow: "0 8px 32px rgba(0,214,50,0.3)",
          animation: "pageIn 0.4s ease",
        }}
      >
        ✓
      </div>

      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", margin: 0 }}>
          Payment Sent!
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#666", margin: "4px 0 0" }}>
          Your money is on its way.
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          width: "100%",
          background: "#141414",
          border: "1px solid #1e1e1e",
          borderRadius: "16px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {/* Total */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid #1e1e1e",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#888" }}>Total sent</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#00D632" }}>
            {formatCents(payment.total_amount_cents)}
          </span>
        </div>

        {/* Recipients */}
        {payment.recipients.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.4rem 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: avatarColor(r.username || r.email),
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {getInitials(r.username || r.email)}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                  {r.username}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#666" }}>{r.email}</div>
              </div>
            </div>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#00D632" }}>
              {formatCents(r.amount_cents)}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ width: "100%", display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button
          onClick={() => navigateTo("")}
          style={{
            flex: 1,
            padding: "0.9rem",
            borderRadius: "14px",
            border: "1px solid #333",
            background: "transparent",
            color: "#ccc",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>
        <button
          onClick={() => navigateTo("#send")}
          style={{
            flex: 1,
            padding: "0.9rem",
            borderRadius: "14px",
            border: "none",
            background: "#00D632",
            color: "#000",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Send Another
        </button>
      </div>
    </div>
  );
}
