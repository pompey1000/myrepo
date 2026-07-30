import { useState, useEffect } from "react";
import { apiGet } from "../api.js";

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

  function fetchTransactions() {
    setLoading(true);
    setError(null);
    apiGet("/transactions")
      .then((data) => {
        setTransactions(data.transactions);
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

  if (!transactions || transactions.length === 0) {
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
          When you send or receive money, it will show up here.
        </div>
      </div>
    );
  }

  const grouped = groupByDate(transactions);
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
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
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
