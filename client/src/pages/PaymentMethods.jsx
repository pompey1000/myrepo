import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiGet, apiDelete } from "../api.js";

export default function PaymentMethods() {
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/payment-methods");
      setMethods(data.paymentMethods || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await apiDelete(`/payment-methods/${id}`);
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
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
        padding: "1rem 1.25rem",
        gap: "1rem",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "0.25rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", margin: 0 }}>
          Payment Methods
        </h1>
        <p style={{ fontSize: "0.8rem", color: "#666", margin: "2px 0 0" }}>
          Manage your cards and bank accounts
        </p>
      </div>

      {error && (
        <div
          style={{
            color: "#ff4444",
            fontSize: "0.85rem",
            textAlign: "center",
            background: "rgba(255,68,68,0.1)",
            padding: "0.6rem",
            borderRadius: "10px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "#888", padding: "2rem 0", fontSize: "0.9rem" }}>
          Loading...
        </div>
      ) : methods.length === 0 ? (
        <div
          style={{
            background: "#141414",
            borderRadius: "16px",
            border: "1px solid #1e1e1e",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>💳</div>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            No payment methods yet. Add a card or bank account to start sending money.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {methods.map((method) => (
            <div
              key={method.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderRadius: "14px",
                background: "#141414",
                border: "1px solid #1e1e1e",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    background:
                      method.type === "card"
                        ? "rgba(0,214,50,0.1)"
                        : "rgba(100,180,255,0.1)",
                    color: method.type === "card" ? "#00D632" : "#64b4ff",
                  }}
                >
                  {method.type === "card" ? "💳" : "🏦"}
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>
                    {method.type === "card" ? "Debit Card" : "Bank Account"}
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    ····{method.last_four}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(method.id)}
                disabled={deleting === method.id}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  background: "transparent",
                  color: "#ff4444",
                  fontSize: "0.8rem",
                  cursor: deleting === method.id ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
              >
                {deleting === method.id ? "..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => navigate("#add-card")}
          style={{
            flex: 1,
            padding: "0.85rem",
            borderRadius: "14px",
            border: "1px dashed #333",
            background: "#141414",
            color: "#00D632",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add Card
        </button>
        <button
          onClick={() => navigate("#add-bank")}
          style={{
            flex: 1,
            padding: "0.85rem",
            borderRadius: "14px",
            border: "1px dashed #333",
            background: "#141414",
            color: "#00D632",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add Bank
        </button>
      </div>
    </div>
  );
}
