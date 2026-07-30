import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiGet } from "../api.js";

function formatCents(cents) {
  const dollars = (cents / 100).toFixed(2);
  const [whole, decimal] = dollars.split(".");
  return { whole: `$${whole}`, decimal };
}

export default function Home({ onBalanceChange }) {
  const { user } = useAuth();
  const [balanceCents, setBalanceCents] = useState(null);
  const [balanceError, setBalanceError] = useState(false);

  useEffect(() => {
    apiGet("/users/me/balance")
      .then((data) => {
        setBalanceCents(data.balanceCents);
        onBalanceChange?.(data.balanceCents);
      })
      .catch(() => setBalanceError(true));
  }, []);

  function navigate(hash) {
    window.location.hash = hash;
    window.dispatchEvent(new Event("hashchange"));
  }

  const balance = balanceCents !== null ? formatCents(balanceCents) : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem 1.25rem",
        gap: "1.25rem",
      }}
    >
      {/* Greeting */}
      <div style={{ width: "100%", paddingTop: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 0 }}>
            Good {getGreeting()}, {user.username}
          </p>
          {user.membership === "premium" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#00D632",
                background: "rgba(0,214,50,0.1)",
                border: "1px solid rgba(0,214,50,0.25)",
                borderRadius: "6px",
                padding: "0.15rem 0.45rem",
                whiteSpace: "nowrap",
              }}
            >
              ⭐ PREMIUM
            </span>
          )}
          {user.accountType === "business" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#00D632",
                background: "rgba(0,214,50,0.1)",
                border: "1px solid rgba(0,214,50,0.25)",
                borderRadius: "6px",
                padding: "0.15rem 0.45rem",
                whiteSpace: "nowrap",
              }}
            >
              🏢 BUSINESS
            </span>
          )}
          {user.accountType !== "business" && user.membership !== "premium" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#888",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "0.15rem 0.45rem",
                whiteSpace: "nowrap",
              }}
            >
              👤 PERSONAL
            </span>
          )}
          {user.accountType === "business" && user.membership === "premium" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#888",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "0.15rem 0.45rem",
                whiteSpace: "nowrap",
              }}
            >
              👤 PERSONAL
            </span>
          )}
        </div>
      </div>

      {/* Balance Card */}
      <div
        style={{
          width: "100%",
          background: "linear-gradient(145deg, #121212 0%, #1a1a1a 50%, #0d1f14 100%)",
          borderRadius: "20px",
          padding: "1.75rem 1.5rem",
          textAlign: "center",
          border: "1px solid #1e2e23",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle glow behind balance */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,214,50,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.5rem",
            position: "relative",
          }}
        >
          Available Balance
        </div>

        {balanceError ? (
          <div style={{ fontSize: "2.2rem", color: "#888", fontWeight: 700 }}>—</div>
        ) : balance === null ? (
          <div style={{ fontSize: "2.2rem", color: "#888", fontWeight: 700 }}>...</div>
        ) : (
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              color: "#00D632",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              position: "relative",
            }}
          >
            <span style={{ fontSize: "2rem", verticalAlign: "top", marginRight: "2px" }}>$</span>
            {balance.whole.replace("$", "")}
            <span style={{ fontSize: "1.6rem", opacity: 0.7 }}>.{balance.decimal}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "0.75rem",
        }}
      >
        <button
          onClick={() => navigate("#send")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "1rem 0.5rem",
            borderRadius: "16px",
            border: "none",
            background: "#00D632",
            color: "#000",
            cursor: "pointer",
            minHeight: "72px",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            boxShadow: "0 4px 16px rgba(0,214,50,0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,214,50,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,214,50,0.25)";
          }}
        >
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>💸</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Send
          </span>
        </button>

        <ActionButton
          icon="🏦"
          label="Withdraw"
          onClick={() => navigate("#withdraw")}
        />
        <ActionButton
          icon="📋"
          label="History"
          onClick={() => navigate("#history")}
        />
        <ActionButton
          icon="💳"
          label="Cards"
          onClick={() => navigate("#payment-methods")}
        />
      </div>

      {/* Quick actions hint */}
      <div
        style={{
          width: "100%",
          padding: "1rem 0.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#555",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.25rem",
          }}
        >
          Quick Actions
        </div>

        <QuickAction
          icon="💰"
          label="View transaction history"
          subtitle="See all your sent and received payments"
          onClick={() => navigate("#history")}
        />
        <QuickAction
          icon="🔗"
          label="Manage payment methods"
          subtitle="Add or remove cards and bank accounts"
          onClick={() => navigate("#payment-methods")}
        />
      </div>

      {/* Premium upsell for free users */}
      {user.membership !== "premium" && (
        <button
          onClick={() => navigate("#premium")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "16px",
            border: "1px solid rgba(0,214,50,0.2)",
            background: "linear-gradient(135deg, rgba(0,214,50,0.06), rgba(0,230,118,0.03))",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,214,50,0.1)";
            e.currentTarget.style.borderColor = "rgba(0,214,50,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,214,50,0.06), rgba(0,230,118,0.03))";
            e.currentTarget.style.borderColor = "rgba(0,214,50,0.2)";
          }}
        >
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>✨</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
              Upgrade to Premium
            </div>
            <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "2px" }}>
              No fees on any withdrawals
            </div>
          </div>
          <span style={{ color: "#00D632", fontSize: "1.2rem", flexShrink: 0 }}>→</span>
        </button>
      )}

      {/* About link */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          padding: "0.5rem 0 0.25rem",
        }}
      >
        <span
          onClick={() => navigate("#about")}
          style={{
            color: "#555",
            fontSize: "0.8rem",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#00D632"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}
        >
          About QuickSplit
        </span>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "1rem 0.5rem",
        borderRadius: "16px",
        border: "1px solid #222",
        background: "#141414",
        color: "#fff",
        cursor: "pointer",
        minHeight: "72px",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#1a1a1a";
        e.currentTarget.style.borderColor = "#333";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#141414";
        e.currentTarget.style.borderColor = "#222";
      }}
    >
      <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
        {label}
      </span>
    </button>
  );
}

function QuickAction({ icon, label, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.9rem",
        padding: "0.85rem 1rem",
        borderRadius: "12px",
        border: "1px solid #1e1e1e",
        background: "#141414",
        color: "#fff",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#141414";
      }}
    >
      <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0 }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "0.75rem", color: "#666" }}>{subtitle}</span>
      </div>
    </button>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
