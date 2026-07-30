import { useState, useEffect, useMemo } from "react";
import { apiGet, apiPost } from "../api.js";

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Withdraw({ onBalanceChange }) {
  const [balanceCents, setBalanceCents] = useState(null);
  const [balanceError, setBalanceError] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [amountCents, setAmountCents] = useState(0);
  const [rawInput, setRawInput] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch balance
  useEffect(() => {
    apiGet("/users/me/balance")
      .then((data) => {
        setBalanceCents(data.balanceCents);
        onBalanceChange?.(data.balanceCents);
      })
      .catch(() => setBalanceError(true));
  }, []);

  // Fetch payment methods
  useEffect(() => {
    apiGet("/payment-methods")
      .then((data) => {
        setPaymentMethods(data.paymentMethods || []);
        setMethodsLoading(false);
      })
      .catch(() => setMethodsLoading(false));
  }, []);

  const feeCents = useMemo(() => {
    if (!selectedMethod || amountCents <= 0) return 0;
    if (selectedMethod.type === "card") {
      return Math.ceil(amountCents * 0.02);
    }
    return 0;
  }, [amountCents, selectedMethod]);

  const netCents = amountCents - feeCents;

  const canWithdraw = amountCents > 0 && selectedMethod && !withdrawing && balanceCents !== null && amountCents <= balanceCents;

  function handleQuickAmount(cents) {
    setRawInput(String(cents / 100));
    setAmountCents(cents);
    setError(null);
  }

  function handleInputChange(e) {
    const val = e.target.value;
    // Allow digits and up to 2 decimal places
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setRawInput(val);
      if (val === "") {
        setAmountCents(0);
      } else {
        const parsed = Math.round(parseFloat(val) * 100);
        setAmountCents(isNaN(parsed) ? 0 : parsed);
      }
      setError(null);
    }
  }

  async function handleWithdraw() {
    if (!canWithdraw) return;

    setWithdrawing(true);
    setError(null);

    try {
      const data = await apiPost("/withdraw", {
        amountCents,
        paymentMethodId: selectedMethod.id,
      });
      setSuccess(data);
      setBalanceCents(data.newBalanceCents);
      onBalanceChange?.(data.newBalanceCents);
    } catch (err) {
      setError(err.message);
    } finally {
      setWithdrawing(false);
    }
  }

  function handleDone() {
    window.location.hash = "";
    window.dispatchEvent(new Event("hashchange"));
  }

  // Success state
  if (success) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem 1.5rem",
          gap: "1.5rem",
        }}
      >
        {/* Checkmark */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(0, 214, 50, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            marginTop: "1rem",
          }}
        >
          ✅
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", textAlign: "center" }}>
          Withdrawal Successful
        </h2>

        <div
          style={{
            width: "100%",
            background: "#141414",
            border: "1px solid #1a1a1a",
            borderRadius: "16px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#888", fontSize: "0.9rem" }}>Amount withdrawn</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{formatCents(success.amountCents)}</span>
          </div>
          {success.feeCents > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#888", fontSize: "0.9rem" }}>Fee (2% card)</span>
              <span style={{ color: "#ff9800", fontWeight: 600 }}>−{formatCents(success.feeCents)}</span>
            </div>
          )}
          <div style={{ height: "1px", background: "#222" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontWeight: 600 }}>You'll receive</span>
            <span style={{ color: "#00D632", fontWeight: 700, fontSize: "1.15rem" }}>
              {formatCents(success.netCents)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#888", fontSize: "0.85rem" }}>To</span>
            <span style={{ color: "#ccc", fontSize: "0.85rem" }}>
              {success.paymentMethod.type === "card" ? "💳" : "🏦"} {success.paymentMethod.type.toUpperCase()} ····{success.paymentMethod.lastFour}
            </span>
          </div>
        </div>

        <button
          onClick={handleDone}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "50px",
            border: "none",
            background: "#00D632",
            color: "#000",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1rem 1.25rem",
        gap: "1.25rem",
      }}
    >
      {/* Available Balance */}
      <div style={{ width: "100%", textAlign: "center", paddingTop: "0.25rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
          Available Balance
        </div>
        {balanceError ? (
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ff4444" }}>Error</div>
        ) : balanceCents === null ? (
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#888" }}>...</div>
        ) : (
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#00D632" }}>
            {formatCents(balanceCents)}
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div style={{ width: "100%" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.5rem",
          }}
        >
          Withdraw Amount
        </label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#141414",
            border: "1px solid #222",
            borderRadius: "16px",
            padding: "0 1rem",
            transition: "border-color 0.2s ease",
          }}
        >
          <span style={{ fontSize: "1.8rem", fontWeight: 700, color: "#00D632", marginRight: "0.25rem" }}>$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={rawInput}
            onChange={handleInputChange}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.8rem",
              fontWeight: 700,
              padding: "0.85rem 0",
              outline: "none",
              fontFamily: "inherit",
              letterSpacing: "-0.02em",
              minWidth: 0,
            }}
          />
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        {[2500, 5000, 10000, 20000].map((cents) => (
          <button
            key={cents}
            onClick={() => handleQuickAmount(cents)}
            style={{
              padding: "0.6rem 0",
              borderRadius: "12px",
              border: amountCents === cents ? "2px solid #00D632" : "1px solid #222",
              background: amountCents === cents ? "rgba(0, 214, 50, 0.08)" : "#141414",
              color: amountCents === cents ? "#00D632" : "#ccc",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {formatCents(cents)}
          </button>
        ))}
      </div>

      {/* Payment Method Selector */}
      <div style={{ width: "100%" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.5rem",
          }}
        >
          Destination
        </label>

        {methodsLoading ? (
          <div style={{ color: "#555", fontSize: "0.9rem", padding: "1rem 0" }}>Loading payment methods...</div>
        ) : paymentMethods.length === 0 ? (
          <div
            style={{
              padding: "1rem",
              borderRadius: "12px",
              background: "#141414",
              border: "1px solid #222",
              textAlign: "center",
              color: "#888",
              fontSize: "0.85rem",
            }}
          >
            No payment methods found.{" "}
            <span
              onClick={() => {
                window.location.hash = "#payment-methods";
                window.dispatchEvent(new Event("hashchange"));
              }}
              style={{ color: "#00D632", cursor: "pointer", textDecoration: "underline" }}
            >
              Add one
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {paymentMethods.map((pm) => {
              const isSelected = selectedMethod?.id === pm.id;
              const isCard = pm.type === "card";

              return (
                <button
                  key={pm.id}
                  onClick={() => {
                    setSelectedMethod(pm);
                    setError(null);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    borderRadius: "14px",
                    border: isSelected ? "2px solid #00D632" : "1px solid #222",
                    background: isSelected ? "rgba(0, 214, 50, 0.06)" : "#141414",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: isCard ? "rgba(255, 152, 0, 0.12)" : "rgba(0, 214, 50, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      flexShrink: 0,
                    }}
                  >
                    {isCard ? "💳" : "🏦"}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                      {isCard ? "Card" : "Bank Account"} ····{pm.last_four}
                    </div>
                  </div>

                  {/* Fee badge */}
                  <div
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: isCard ? "rgba(255, 152, 0, 0.15)" : "rgba(0, 214, 50, 0.12)",
                      color: isCard ? "#ff9800" : "#00D632",
                      flexShrink: 0,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {isCard ? "2% fee" : "Free"}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#00D632",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "#000", fontSize: "0.65rem", fontWeight: 700 }}>✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fee Breakdown */}
      {amountCents > 0 && selectedMethod && (
        <div
          style={{
            width: "100%",
            background: "#141414",
            border: "1px solid #222",
            borderRadius: "16px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#888", fontSize: "0.9rem" }}>Withdrawal amount</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{formatCents(amountCents)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#888", fontSize: "0.9rem" }}>
              Fee {selectedMethod.type === "card" ? "(2% card)" : ""}
            </span>
            <span style={{ color: feeCents > 0 ? "#ff9800" : "#00D632", fontWeight: 600 }}>
              {feeCents > 0 ? `−${formatCents(feeCents)}` : "$0.00"}
            </span>
          </div>
          <div style={{ height: "1px", background: "#222" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem" }}>You'll receive</span>
            <span style={{ color: "#00D632", fontWeight: 700, fontSize: "1.2rem" }}>
              {formatCents(netCents)}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
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

      {/* Withdraw Button */}
      <button
        onClick={handleWithdraw}
        disabled={!canWithdraw}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: "50px",
          border: "none",
          background: canWithdraw ? "#00D632" : "#1a1a1a",
          color: canWithdraw ? "#000" : "#555",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: canWithdraw ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          marginTop: "0.5rem",
          opacity: canWithdraw ? 1 : 0.5,
        }}
      >
        {withdrawing
          ? "Processing..."
          : amountCents > 0
          ? `Withdraw ${formatCents(amountCents)}`
          : "Enter an amount to withdraw"}
      </button>
    </div>
  );
}
