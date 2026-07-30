import { useState } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { useStripeContext } from "../components/StripeProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiPost } from "../api.js";

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    padding: "1rem 1.25rem",
    gap: "1rem",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#fff",
  },
  card: {
    width: "100%",
    background: "#141414",
    borderRadius: "16px",
    padding: "1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    border: "1px solid #1e1e1e",
  },
  input: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "12px",
    border: "1px solid #222",
    background: "#0a0a0a",
    color: "#f0f0f0",
    fontSize: "1rem",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "12px",
    border: "1px solid #222",
    background: "#0a0a0a",
    color: "#f0f0f0",
    fontSize: "1rem",
    outline: "none",
    appearance: "none",
    cursor: "pointer",
  },
  button: {
    width: "100%",
    padding: "0.9rem",
    borderRadius: "14px",
    border: "none",
    background: "#00D632",
    color: "#000",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,214,50,0.2)",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  error: {
    color: "#ff4444",
    fontSize: "0.85rem",
    textAlign: "center",
    background: "rgba(255,68,68,0.1)",
    padding: "0.6rem",
    borderRadius: "10px",
  },
  success: {
    color: "#00D632",
    fontSize: "0.85rem",
    textAlign: "center",
    background: "rgba(0,214,50,0.1)",
    padding: "0.6rem",
    borderRadius: "10px",
  },
  demoBadge: {
    display: "inline-block",
    background: "rgba(255,193,7,0.15)",
    color: "#ffc107",
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "0.2rem 0.6rem",
    borderRadius: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  label: {
    fontSize: "0.75rem",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: "0.35rem",
    paddingLeft: "2px",
  },
};

function DemoBankForm({ onSubmit, submitting, error, success }) {
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderType, setHolderType] = useState("individual");

  function handleSubmit(e) {
    e.preventDefault();
    if (!routing || !account) return;

    const lastFour = account.slice(-4);
    const fakeToken = `demo_tok_${Date.now()}`;
    onSubmit(fakeToken, lastFour);
  }

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <div style={{ textAlign: "center", marginBottom: "-0.25rem" }}>
        <span style={styles.demoBadge}>Demo Mode</span>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div>
        <label style={styles.label}>Account Holder Name</label>
        <input
          style={styles.input}
          type="text"
          placeholder="John Doe"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div>
        <label style={styles.label}>Account Holder Type</label>
        <select
          style={styles.select}
          value={holderType}
          onChange={(e) => setHolderType(e.target.value)}
        >
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select>
      </div>

      <div>
        <label style={styles.label}>Routing Number</label>
        <input
          style={styles.input}
          type="text"
          placeholder="110000000"
          value={routing}
          onChange={(e) => setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
          maxLength={9}
          autoComplete="off"
        />
      </div>

      <div>
        <label style={styles.label}>Account Number</label>
        <input
          style={styles.input}
          type="text"
          placeholder="000123456789"
          value={account}
          onChange={(e) => setAccount(e.target.value.replace(/\D/g, "").slice(0, 17))}
          maxLength={17}
          autoComplete="off"
        />
      </div>

      <button
        style={{
          ...styles.button,
          ...(submitting ? styles.buttonDisabled : {}),
        }}
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Adding..." : "Add Bank Account"}
      </button>
    </form>
  );
}

function StripeBankForm({ onSubmit, submitting, error, success }) {
  const stripe = useStripe();
  const elements = useElements();
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderType, setHolderType] = useState("individual");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!routing || !account) {
      onSubmit(null, null, "Routing and account numbers are required");
      return;
    }

    const { token, error: stripeError } = await stripe.createToken("bank_account", {
      country: "US",
      currency: "usd",
      routing_number: routing,
      account_number: account,
      account_holder_name: holderName || undefined,
      account_holder_type: holderType,
    });

    if (stripeError) {
      onSubmit(null, null, stripeError.message);
      return;
    }

    onSubmit(token.id, token.bank_account.last4);
  }

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div>
        <label style={styles.label}>Account Holder Name</label>
        <input
          style={styles.input}
          type="text"
          placeholder="John Doe"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div>
        <label style={styles.label}>Account Holder Type</label>
        <select
          style={styles.select}
          value={holderType}
          onChange={(e) => setHolderType(e.target.value)}
        >
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select>
      </div>

      <div>
        <label style={styles.label}>Routing Number</label>
        <input
          style={styles.input}
          type="text"
          placeholder="110000000"
          value={routing}
          onChange={(e) => setRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
          maxLength={9}
          autoComplete="off"
        />
      </div>

      <div>
        <label style={styles.label}>Account Number</label>
        <input
          style={styles.input}
          type="text"
          placeholder="000123456789"
          value={account}
          onChange={(e) => setAccount(e.target.value.replace(/\D/g, "").slice(0, 17))}
          maxLength={17}
          autoComplete="off"
        />
      </div>

      <button
        style={{
          ...styles.button,
          ...(submitting || !stripe ? styles.buttonDisabled : {}),
        }}
        type="submit"
        disabled={submitting || !stripe}
      >
        {submitting ? "Adding..." : "Add Bank Account"}
      </button>
    </form>
  );
}

export default function AddBank() {
  const { hasStripe } = useStripeContext();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleToken(tokenId, lastFour, stripeError) {
    setError("");
    setSuccess("");

    if (stripeError) {
      setError(stripeError);
      return;
    }

    if (!tokenId || !lastFour) {
      setError("Invalid bank account data");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/payment-methods", {
        stripeToken: tokenId,
        type: "bank",
        lastFour,
      });
      setSuccess("Bank account added successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Add Bank Account</h1>

      {hasStripe ? (
        <StripeBankForm
          onSubmit={handleToken}
          submitting={submitting}
          error={error}
          success={success}
        />
      ) : (
        <DemoBankForm
          onSubmit={handleToken}
          submitting={submitting}
          error={error}
          success={success}
        />
      )}
    </div>
  );
}
