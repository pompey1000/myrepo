import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiPost } from "../api.js";

export default function Premium() {
  const { user, refreshUser } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState(null);

  const isPremium = user?.membership === "premium";

  async function handleUpgrade() {
    setUpgrading(true);
    setError(null);
    try {
      await apiPost("/membership/upgrade", {});
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  }

  function navigate(hash) {
    window.location.hash = hash;
    window.dispatchEvent(new Event("hashchange"));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem 1.25rem",
        gap: "1.5rem",
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          paddingTop: "0.5rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0,214,50,0.2), rgba(0,230,118,0.2))",
            border: "2px solid rgba(0,214,50,0.4)",
            fontSize: "2.2rem",
            marginBottom: "1rem",
          }}
        >
          💎
        </div>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.03em",
            marginBottom: "0.4rem",
          }}
        >
          Go Premium
        </h1>
        <p
          style={{
            color: "#888",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            maxWidth: "320px",
            margin: "0 auto",
          }}
        >
          Unlock unlimited free withdrawals and exclusive benefits.
        </p>
      </div>

      {/* Current Plan */}
      <div
        style={{
          width: "100%",
          background: "#141414",
          border: "1px solid #222",
          borderRadius: "16px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.3rem" }}>
            {isPremium ? "⭐" : "👤"}
          </span>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
              Current Plan
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: isPremium ? "#00D632" : "#888",
                fontWeight: 500,
              }}
            >
              {isPremium ? "Premium Member" : "Free Plan"}
            </div>
          </div>
        </div>
        <span
          style={{
            padding: "0.3rem 0.7rem",
            borderRadius: "20px",
            fontSize: "0.7rem",
            fontWeight: 700,
            background: isPremium
              ? "rgba(0,214,50,0.12)"
              : "rgba(255,255,255,0.05)",
            color: isPremium ? "#00D632" : "#888",
            border: isPremium
              ? "1px solid rgba(0,214,50,0.25)"
              : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {isPremium ? "ACTIVE" : "FREE"}
        </span>
      </div>

      {/* Benefits List */}
      <div style={{ width: "100%" }}>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.75rem",
          }}
        >
          Premium Benefits
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <BenefitItem
            icon="💰"
            title="No fees on any withdrawals"
            description="Zero fees on debit card and bank withdrawals — save up to 5% per transaction"
            highlight
          />
          <BenefitItem
            icon="🎯"
            title="Priority support"
            description="Get help faster with dedicated premium support queue"
          />
          <BenefitItem
            icon="📈"
            title="Higher transaction limits"
            description="Send and receive larger amounts (coming soon)"
          />
          <BenefitItem
            icon="🏢"
            title="Business tools"
            description="Advanced reporting and multi-user management (coming soon)"
          />
        </div>
      </div>

      {/* Upgrade Button */}
      {isPremium ? (
        <div
          style={{
            width: "100%",
            textAlign: "center",
            padding: "1.5rem 1rem",
            background: "linear-gradient(145deg, rgba(0,214,50,0.08), rgba(0,230,118,0.04))",
            borderRadius: "20px",
            border: "1px solid rgba(0,214,50,0.2)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎉</div>
          <div
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "#00D632",
              marginBottom: "0.3rem",
            }}
          >
            You're Premium!
          </div>
          <div style={{ fontSize: "0.85rem", color: "#888" }}>
            Enjoy unlimited free withdrawals and all premium benefits.
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.3rem 0.8rem",
              borderRadius: "20px",
              background: "rgba(0,214,50,0.12)",
              border: "1px solid rgba(0,214,50,0.3)",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#00D632",
            }}
          >
            ⭐ Premium Member
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            style={{
              width: "100%",
              padding: "1.1rem",
              borderRadius: "50px",
              border: "none",
              background: upgrading
                ? "#1a3a1a"
                : "linear-gradient(135deg, #00D632, #00e676)",
              color: "#000",
              fontSize: "1.1rem",
              fontWeight: 700,
              cursor: upgrading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: upgrading
                ? "none"
                : "0 4px 24px rgba(0,214,50,0.3)",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (!upgrading) {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 6px 32px rgba(0,214,50,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!upgrading) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,214,50,0.3)";
              }
            }}
          >
            {upgrading ? "Upgrading..." : "Upgrade to Premium — Free Trial"}
          </button>

          {error && (
            <div
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                background: "rgba(255, 68, 68, 0.1)",
                border: "1px solid rgba(255, 68, 68, 0.25)",
                color: "#ff4444",
                fontSize: "0.85rem",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Fine print */}
          <p
            style={{
              color: "#555",
              fontSize: "0.72rem",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Free during beta. Pricing coming soon.
            No payment method required to upgrade.
          </p>
        </>
      )}

      {/* Fee Comparison Table */}
      {!isPremium && (
        <div
          style={{
            width: "100%",
            background: "#141414",
            border: "1px solid #222",
            borderRadius: "16px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Fee Comparison
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#888",
              textAlign: "center",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid #222",
            }}
          >
            <span></span>
            <span>Free</span>
            <span
              style={{
                color: "#00D632",
              }}
            >
              Premium 💎
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.5rem",
              fontSize: "0.8rem",
              textAlign: "center",
              alignItems: "center",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid #1a1a1a",
            }}
          >
            <span style={{ color: "#ccc", textAlign: "left" }}>Card withdrawal</span>
            <span style={{ color: "#ff9800", fontWeight: 600 }}>
              {user?.accountType === "business" ? "5%" : "3.5%"}
            </span>
            <span style={{ color: "#00D632", fontWeight: 700 }}>Free</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.5rem",
              fontSize: "0.8rem",
              textAlign: "center",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#ccc", textAlign: "left" }}>Bank withdrawal</span>
            <span style={{ color: "#00D632", fontWeight: 600 }}>Free</span>
            <span style={{ color: "#00D632", fontWeight: 700 }}>Free</span>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate("")}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: "50px",
          border: "1px solid #333",
          background: "#141414",
          color: "#ccc",
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1a1a1a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#141414";
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
}

function BenefitItem({ icon, title, description, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.9rem",
        padding: "0.85rem 1rem",
        borderRadius: "14px",
        background: highlight ? "rgba(0,214,50,0.04)" : "#141414",
        border: highlight
          ? "1px solid rgba(0,214,50,0.15)"
          : "1px solid #1e1e1e",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: highlight
            ? "rgba(0,214,50,0.1)"
            : "rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: highlight ? "#00D632" : "#fff",
            marginBottom: "0.15rem",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#777", lineHeight: 1.4 }}>
          {description}
        </div>
      </div>
    </div>
  );
}
