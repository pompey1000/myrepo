import { useState, useEffect } from "react";
import { apiGet, listSplits } from "../api.js";

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

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yesterday.getTime()) return "Yesterday";

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[txDate.getMonth()]} ${txDate.getDate()}, ${txDate.getFullYear()}`;
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr + "Z");
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCompactDate(dateStr) {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateLabel(dateStr);
}

function groupByDate(transactions) {
  const groups = {};
  for (const tx of transactions) {
    const label = formatDateLabel(tx.created_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }
  return groups;
}

export default function History() {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [splits, setSplits] = useState([]);

  function fetchTransactions() {
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet("/transactions"),
      listSplits().catch(() => ({ payments: [] })),
    ])
      .then(([txData, splitData]) => {
        setTransactions(txData.transactions);
        setSplits(splitData.payments || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          color: "#888",
          fontSize: "0.95rem",
        }}
      >
        Loading transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          color: "#ff4444",
          gap: "0.75rem",
          padding: "2rem",
        }}
      >
        <div style={{ fontSize: "2rem" }}>⚠</div>
        <div>Failed to load transactions</div>
        <button
          onClick={fetchTransactions}
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: "50px",
            border: "1px solid #333",
            background: "#141414",
            color: "#ccc",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  const hasTransactions = transactions && transactions.length > 0;
  const hasSplits = splits && splits.length > 0;

  if (!hasTransactions && !hasSplits) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          padding: "2rem 1.5rem",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#141414",
            border: "2px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
          }}
        >
          📋
        </div>
        <div style={{ fontSize: "1.1rem", color: "#888", fontWeight: 500 }}>No transactions yet</div>
        <div style={{ fontSize: "0.85rem", color: "#555", textAlign: "center" }}>
          When you send, receive, or split money, it will show up here.
        </div>
      </div>
    );
  }

  const grouped = groupByDate(transactions || []);
  const groupOrder = Object.keys(grouped);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1rem 1.25rem",
        gap: "0.25rem",
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", margin: 0 }}>Activity</h1>
          <p style={{ fontSize: "0.8rem", color: "#666", margin: "2px 0 0" }}>
            {(transactions?.length || 0) + (splits?.length || 0)} item{((transactions?.length || 0) + (splits?.length || 0)) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid #333",
            background: "#141414",
            color: "#888",
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Active Splits */}
      {hasSplits && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
              padding: "0 0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                color: "#555",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              Payment Requests
            </span>
            <div style={{ flex: 1, height: "1px", background: "#1a1a1a" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {splits.map((split) => {
              const paidCount = split.recipients?.filter((r) => r.payment_status === "paid").length || 0;
              const totalCount = split.recipients?.length || 0;
              const allPaid = paidCount === totalCount;

              return (
                <div
                  key={split.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "14px",
                    background: "#141414",
                    border: "1px solid #1a1a1a",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    sessionStorage.setItem(
                      "sendConfirm",
                      JSON.stringify({ payment: split, mode: "live" })
                    );
                    window.location.hash = "#send-confirm";
                    window.dispatchEvent(new Event("hashchange"));
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: allPaid
                        ? "linear-gradient(135deg, #00D632, #00e676)"
                        : "linear-gradient(135deg, #ff9800, #ffb74d)",
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      flexShrink: 0,
                    }}
                  >
                    {allPaid ? "✓" : paidCount}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {totalCount} recipient{totalCount !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#555", marginTop: "1px" }}>
                      {allPaid
                        ? "All paid"
                        : `${paidCount} of ${totalCount} paid`}{" "}
                      · {formatCompactDate(split.created_at)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#00D632",
                      }}
                    >
                      {formatCents(split.total_amount_cents)}
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.4rem",
                        borderRadius: "8px",
                        background: allPaid ? "rgba(0,214,50,0.15)" : "rgba(255,152,0,0.15)",
                        color: allPaid ? "#00D632" : "#ff9800",
                      }}
                    >
                      {allPaid ? "COMPLETED" : "PENDING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction groups */}
      {groupOrder.map((dateLabel) => (
        <div key={dateLabel} style={{ marginBottom: "1rem" }}>
          {/* Date divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
              padding: "0 0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                color: "#555",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              {dateLabel}
            </span>
            <div style={{ flex: 1, height: "1px", background: "#1a1a1a" }} />
          </div>

          {/* Transaction cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {grouped[dateLabel].map((tx) => {
              const isReceived = tx.direction === "received";
              const isWithdrawal = tx.direction === "withdrawal";
              const otherName = isWithdrawal ? "Withdrawal" : (tx.other_user?.username || tx.other_user?.email);
              const initials = isWithdrawal ? "WD" : getInitials(otherName);
              const color = isWithdrawal ? "#ff9800" : avatarColor(otherName);

              return (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "14px",
                    background: "#141414",
                    border: "1px solid #1a1a1a",
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: color,
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {initials}
                    {/* Direction badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: isWithdrawal ? "#ff9800" : isReceived ? "#00D632" : "#ff4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        border: "2px solid #141414",
                      }}
                    >
                      {isWithdrawal ? "−" : isReceived ? "↓" : "↑"}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        color: "#fff",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {otherName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#555",
                        marginTop: "1px",
                      }}
                    >
                      {isWithdrawal ? "Withdrawn" : isReceived ? "Received" : "Sent"} · {formatDateShort(tx.created_at)}
                    </div>
                  </div>

                  {/* Amount */}
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: isWithdrawal ? "#ff9800" : isReceived ? "#00D632" : "#ff4444",
                      flexShrink: 0,
                      textAlign: "right",
                    }}
                  >
                    {isReceived ? "+" : "−"}
                    {formatCents(tx.amount_cents)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
