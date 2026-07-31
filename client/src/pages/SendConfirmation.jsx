import { useState, useEffect, useCallback } from "react";
import { getSplitStatus } from "../api.js";

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

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  }
}

export default function SendConfirmation() {
  const [data, setData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

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

  const refreshStatus = useCallback(async () => {
    if (!data?.payment?.id) return;
    try {
      const result = await getSplitStatus(data.payment.id);
      if (result.payment) {
        setData((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, payment: result.payment };
          sessionStorage.setItem("sendConfirm", JSON.stringify(updated));
          return updated;
        });
      }
    } catch {
      // ignore refresh errors
    }
  }, [data?.payment?.id]);

  // Auto-refresh every 15s if there are pending recipients
  useEffect(() => {
    if (!data?.payment?.recipients) return;
    const hasPending = data.payment.recipients.some((r) => r.payment_status === "pending");
    if (!hasPending) return;

    const interval = setInterval(refreshStatus, 15000);
    return () => clearInterval(interval);
  }, [data, refreshStatus]);

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

  const { payment, mode } = data;
  const isSimulated = mode === "simulated" || !payment.recipients?.[0]?.payment_link_url;
  const allPaid = payment.recipients?.every((r) => r.payment_status === "paid");
  const paidCount = payment.recipients?.filter((r) => r.payment_status === "paid").length || 0;
  const totalCount = payment.recipients?.length || 0;

  const handleCopyAllLinks = () => {
    const links = payment.recipients
      .filter((r) => r.payment_link_url)
      .map((r) => `${r.username || r.email}: ${r.payment_link_url}`)
      .join("\n");
    copyToClipboard(links);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyLink = (index, url) => {
    copyToClipboard(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
      {/* Status icon */}
      <div
        style={{
          width: "88px",
          height: "88px",
          borderRadius: "50%",
          background: allPaid
            ? "linear-gradient(135deg, #00D632, #00e676)"
            : "linear-gradient(135deg, #ff9800, #ffb74d)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.8rem",
          color: "#000",
          marginTop: "1.5rem",
          boxShadow: allPaid
            ? "0 8px 32px rgba(0,214,50,0.3)"
            : "0 8px 32px rgba(255,152,0,0.3)",
          animation: "pageIn 0.4s ease",
        }}
      >
        {isSimulated ? "✓" : allPaid ? "✓" : "⏳"}
      </div>

      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", margin: 0 }}>
          {isSimulated
            ? "Payment Sent!"
            : allPaid
            ? "All Paid!"
            : "✅ Split Created!"}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#666", margin: "4px 0 0" }}>
          {isSimulated
            ? "Your money is on its way."
            : allPaid
            ? "Everyone has paid their share."
            : `Each person can now pay via their secure Stripe link. ${paidCount} of ${totalCount} paid so far.`}
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
          <span style={{ fontSize: "0.85rem", color: "#888" }}>Total requested</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#00D632" }}>
            {formatCents(payment.total_amount_cents)}
          </span>
        </div>

        {/* Recipients */}
        {payment.recipients.map((r, idx) => (
          <div
            key={r.id || idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem 0",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flex: 1, minWidth: 0 }}>
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
                  flexShrink: 0,
                }}
              >
                {getInitials(r.username || r.email)}
              </div>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                  {r.username}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.email}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#00D632" }}>
                {formatCents(r.amount_cents)}
              </span>

              {/* Payment status badge */}
              {!isSimulated && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "20px",
                    background: r.payment_status === "paid" ? "rgba(0,214,50,0.15)" : "rgba(255,152,0,0.15)",
                    color: r.payment_status === "paid" ? "#00D632" : "#ff9800",
                    border: `1px solid ${r.payment_status === "paid" ? "rgba(0,214,50,0.3)" : "rgba(255,152,0,0.3)"}`,
                  }}
                >
                  {r.payment_status === "paid" ? "🟢 Paid" : "🟡 Pending"}
                </span>
              )}
            </div>

            {/* Payment link row */}
            {r.payment_link_url && r.payment_status !== "paid" && (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                <button
                  onClick={() => window.open(r.payment_link_url, "_blank")}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "#00D632",
                    color: "#000",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                  }}
                >
                  💳 Pay with Card
                </button>
                <button
                  onClick={() => handleCopyLink(idx, r.payment_link_url)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "10px",
                    border: "1px solid #333",
                    background: "transparent",
                    color: copiedIndex === idx ? "#00D632" : "#888",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copiedIndex === idx ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payout notice for live mode */}
      {!isSimulated && (
        <div
          style={{
            width: "100%",
            background: "rgba(0, 214, 50, 0.06)",
            border: "1px solid rgba(0, 214, 50, 0.15)",
            borderRadius: "12px",
            padding: "0.85rem 1rem",
            fontSize: "0.8rem",
            color: "#aaa",
            lineHeight: "1.5",
            textAlign: "left",
          }}
        >
          💡 Funds collected go to the QuickSplit account. The organizer receives their payout within 1-2 business days.
        </div>
      )}

      {/* Copy all links button */}
      {!isSimulated && payment.recipients?.some((r) => r.payment_link_url && r.payment_status !== "paid") && (
        <button
          onClick={handleCopyAllLinks}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "12px",
            border: "1px dashed #00D632",
            background: "rgba(0,214,50,0.05)",
            color: copiedAll ? "#00D632" : "#00D632",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          {copiedAll ? "✓ All links copied!" : "📋 Copy all payment links"}
        </button>
      )}

      {/* Refresh button */}
      {!isSimulated && !allPaid && (
        <button
          onClick={refreshStatus}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #333",
            background: "transparent",
            color: "#888",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          🔄 Refresh payment status
        </button>
      )}

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
          {isSimulated ? "Send Another" : "New Split"}
        </button>
      </div>
    </div>
  );
}
