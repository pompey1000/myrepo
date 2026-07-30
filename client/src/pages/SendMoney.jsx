import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiGet, apiPost } from "../api.js";

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

export default function SendMoney({ onBalanceChange }) {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState([
    { id: 1, email: "", amountCents: 0, amountDisplay: "", selectedUser: null },
  ]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState({});
  const [searchLoading, setSearchLoading] = useState({});
  const nextId = useRef(2);

  useEffect(() => {
    apiGet("/payment-methods")
      .then((data) => {
        setPaymentMethods(data.paymentMethods || []);
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          setSelectedMethodId(data.paymentMethods[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const totalCents = recipients.reduce((sum, r) => sum + (r.amountCents || 0), 0);

  const handleSearch = useCallback(async (recipientId, query) => {
    if (!query || query.trim().length < 1) {
      setSearchResults((prev) => ({ ...prev, [recipientId]: [] }));
      return;
    }
    setSearchLoading((prev) => ({ ...prev, [recipientId]: true }));
    try {
      const data = await apiGet(`/users/search?q=${encodeURIComponent(query.trim())}`);
      setSearchResults((prev) => ({ ...prev, [recipientId]: data.users || [] }));
    } catch {
      setSearchResults((prev) => ({ ...prev, [recipientId]: [] }));
    } finally {
      setSearchLoading((prev) => ({ ...prev, [recipientId]: false }));
    }
  }, []);

  const handleSelectUser = (recipientId, selectedUser) => {
    setRecipients((prev) =>
      prev.map((r) =>
        r.id === recipientId ? { ...r, email: selectedUser.email, selectedUser } : r
      )
    );
    setSearchResults((prev) => ({ ...prev, [recipientId]: [] }));
  };

  const handleEmailChange = (recipientId, value) => {
    setRecipients((prev) =>
      prev.map((r) =>
        r.id === recipientId ? { ...r, email: value, selectedUser: null } : r
      )
    );
    handleSearch(recipientId, value);
  };

  const handleAmountChange = (recipientId, displayValue) => {
    const clean = displayValue.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    const sanitized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : clean;

    let cents = 0;
    if (sanitized && sanitized !== ".") {
      const dollars = parseFloat(sanitized);
      if (!isNaN(dollars)) {
        cents = Math.round(dollars * 100);
      }
    }

    setRecipients((prev) =>
      prev.map((r) =>
        r.id === recipientId ? { ...r, amountCents: cents, amountDisplay: sanitized } : r
      )
    );
  };

  const addRecipient = () => {
    const id = nextId.current++;
    setRecipients((prev) => [
      ...prev,
      { id, email: "", amountCents: 0, amountDisplay: "", selectedUser: null },
    ]);
  };

  const removeRecipient = (id) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
    setSearchResults((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const canSend =
    recipients.length > 0 &&
    recipients.every((r) => r.selectedUser && r.amountCents > 0) &&
    selectedMethodId &&
    !sending;

  const handleSend = async () => {
    setError("");
    setSending(true);

    const payload = {
      recipients: recipients.map((r) => ({
        email: r.selectedUser.email,
        amountCents: r.amountCents,
      })),
      paymentMethodId: Number(selectedMethodId),
    };

    try {
      const data = await apiPost("/payments/split", payload);
      const state = {
        payment: data.payment,
        newBalanceCents: data.newBalanceCents,
      };
      sessionStorage.setItem("sendConfirm", JSON.stringify(state));
      onBalanceChange?.(data.newBalanceCents);
      window.location.hash = "#send-confirm";
      window.dispatchEvent(new Event("hashchange"));
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <div style={{ padding: "1.5rem 1.25rem", textAlign: "center" }}>
        {/* Total display */}
        <div style={{ padding: "1.5rem 0 1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            Total
          </div>
          <div style={{ fontSize: "2.6rem", fontWeight: 800, color: "#00D632", letterSpacing: "-0.03em" }}>
            {formatCents(totalCents)}
          </div>
        </div>

        <div
          style={{
            background: "#141414",
            borderRadius: "16px",
            border: "1px solid #222",
            padding: "2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>💳</div>
          <p style={{ color: "#888", fontSize: "0.95rem" }}>You need a payment method to send money.</p>
          <button
            onClick={() => {
              window.location.hash = "#add-card";
              window.dispatchEvent(new Event("hashchange"));
            }}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "50px",
              border: "none",
              background: "#00D632",
              color: "#000",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Add Payment Method
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 1.25rem 0",
        gap: "0.75rem",
        minHeight: "100%",
      }}
    >
      {/* Total Amount Header */}
      <div style={{ textAlign: "center", padding: "1rem 0 0.5rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
          Total
        </div>
        <div style={{ fontSize: "2.6rem", fontWeight: 800, color: "#00D632", letterSpacing: "-0.03em" }}>
          {formatCents(totalCents)}
        </div>
      </div>

      {error && (
        <div
          style={{
            color: "#ff4444",
            fontSize: "0.85rem",
            textAlign: "center",
            padding: "0.5rem 0.75rem",
            background: "rgba(255,68,68,0.1)",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {/* Section: To */}
      <div style={{ fontSize: "0.75rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", paddingLeft: "0.25rem" }}>
        To
      </div>

      {/* Recipient Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {recipients.map((r) => (
          <RecipientRow
            key={r.id}
            recipient={r}
            searchResults={searchResults[r.id] || []}
            searchLoading={searchLoading[r.id] || false}
            canRemove={recipients.length > 1}
            onEmailChange={(v) => handleEmailChange(r.id, v)}
            onSelectUser={(u) => handleSelectUser(r.id, u)}
            onAmountChange={(v) => handleAmountChange(r.id, v)}
            onRemove={() => removeRecipient(r.id)}
            onFocus={() => {
              if (r.email && !r.selectedUser) handleSearch(r.id, r.email);
            }}
          />
        ))}
      </div>

      {/* Add recipient */}
      <button
        onClick={addRecipient}
        style={{
          width: "100%",
          padding: "0.8rem",
          borderRadius: "12px",
          border: "1px dashed #333",
          background: "transparent",
          color: "#00D632",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        + Add recipient
      </button>

      {/* Payment method selector */}
      <div
        style={{
          background: "#141414",
          borderRadius: "14px",
          border: "1px solid #222",
          padding: "0.85rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>
          {paymentMethods.find((pm) => pm.id === Number(selectedMethodId))?.type === "card" ? "💳" : "🏦"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.7rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Paying with
          </div>
          <select
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              width: "100%",
            }}
          >
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.type === "card" ? "Card" : "Bank"} ····{pm.last_four}
              </option>
            ))}
          </select>
          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            {paymentMethods.find((pm) => pm.id === Number(selectedMethodId))?.type === "card" ? "Debit Card" : "Bank Account"}
            {" ····"}
            {paymentMethods.find((pm) => pm.id === Number(selectedMethodId))?.last_four}
          </div>
        </div>
        <span style={{ color: "#666", fontSize: "0.8rem" }}>▾</span>
      </div>

      {/* Send button - sticky at bottom */}
      <div
        style={{
          position: "sticky",
          bottom: "80px",
          padding: "0.75rem 0 1rem",
          background: "linear-gradient(to top, #0a0a0a 60%, transparent)",
        }}
      >
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "14px",
            border: "none",
            background: canSend ? "#00D632" : "#1a1a1a",
            color: canSend ? "#000" : "#444",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: canSend ? "pointer" : "not-allowed",
            boxShadow: canSend ? "0 4px 20px rgba(0,214,50,0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          {sending ? "Sending..." : `Send ${formatCents(totalCents)}`}
        </button>
      </div>
    </div>
  );
}

function RecipientRow({
  recipient,
  searchResults,
  searchLoading,
  canRemove,
  onEmailChange,
  onSelectUser,
  onAmountChange,
  onRemove,
  onFocus,
}) {
  const r = recipient;
  const initials = r.selectedUser
    ? getInitials(r.selectedUser.username || r.selectedUser.email)
    : "?";
  const color = avatarColor(r.selectedUser?.username || r.selectedUser?.email || "?");

  return (
    <div
      style={{
        background: "#141414",
        borderRadius: "14px",
        border: "1px solid #1e1e1e",
        padding: "0.75rem",
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: r.selectedUser ? color : "#222",
          color: r.selectedUser ? "#000" : "#555",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "0.9rem",
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Search / email input */}
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <input
          type="text"
          placeholder="Search by email or username..."
          value={r.selectedUser ? r.selectedUser.email : r.email}
          onChange={(e) => onEmailChange(e.target.value)}
          onFocus={onFocus}
          autoComplete="off"
          style={{
            width: "100%",
            padding: "0.55rem 0.6rem",
            borderRadius: "8px",
            border: "1px solid #222",
            background: "#0a0a0a",
            color: "#f0f0f0",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        {r.selectedUser && (
          <div style={{ fontSize: "0.7rem", color: "#00D632", marginTop: "2px", paddingLeft: "2px" }}>
            @{r.selectedUser.username}
          </div>
        )}

        {/* Dropdown */}
        {(searchResults.length > 0 || searchLoading) && !r.selectedUser && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "10px",
              marginTop: "4px",
              zIndex: 10,
              maxHeight: "180px",
              overflowY: "auto",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            {searchLoading ? (
              <div style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem", textAlign: "center" }}>
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem", textAlign: "center" }}>
                No users found
              </div>
            ) : (
              searchResults.map((u, i) => (
                <div
                  key={u.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectUser(u);
                  }}
                  style={{
                    padding: "0.7rem 0.9rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    borderBottom: i < searchResults.length - 1 ? "1px solid #222" : "none",
                    color: "#ddd",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#222";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: avatarColor(u.username || u.email),
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(u.username || u.email)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{u.username}</div>
                    <div style={{ fontSize: "0.7rem", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.email}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Amount input */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <span
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#555",
            fontSize: "0.9rem",
            pointerEvents: "none",
          }}
        >
          $
        </span>
        <input
          type="text"
          placeholder="0.00"
          value={r.amountDisplay}
          onChange={(e) => onAmountChange(e.target.value)}
          style={{
            width: "90px",
            padding: "0.55rem 0.6rem 0.55rem 1.4rem",
            borderRadius: "8px",
            border: "1px solid #222",
            background: "#0a0a0a",
            color: "#f0f0f0",
            fontSize: "0.95rem",
            outline: "none",
            textAlign: "right",
            fontWeight: 600,
          }}
        />
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={onRemove}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "1px solid #333",
            background: "transparent",
            color: "#ff4444",
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title="Remove recipient"
        >
          ✕
        </button>
      )}
    </div>
  );
}
