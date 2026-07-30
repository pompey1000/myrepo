import { useState } from "react";
import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useStripeContext } from "../components/StripeProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiPost } from "../api.js";

const darkInputStyles = {
  style: {
    base: {
      color: "#f0f0f0",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": { color: "#555" },
      iconColor: "#00D632",
    },
    invalid: {
      color: "#ff4444",
      iconColor: "#ff4444",
    },
  },
};

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
  stripeContainer: {
    padding: "0.85rem 0.75rem",
    borderRadius: "12px",
    border: "1px solid #222",
    background: "#0a0a0a",
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
  inputRow: {
    display: "flex",
    gap: "0.75rem",
  },
  halfInput: {
    flex: 1,
    padding: "0.85rem 0.75rem",
    borderRadius: "12px",
    border: "1px solid #222",
    background: "#0a0a0a",
    color: "#f0f0f0",
    fontSize: "1rem",
    outline: "none",
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

function CardElementField() {
  return (
    <div style={styles.stripeContainer}>
      <CardElement options={darkInputStyles} />
    </div>
  );
}

function DemoCardForm({ onSubmit, submitting, error, success }) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!number || !expiry || !cvc) {
      return;
    }
    const cleaned = number.replace(/\s/g, "");
    const lastFour = cleaned.slice(-4);
    // Simulate a stripeToken
    const fakeToken = `demo_tok_${Date.now()}`;
    onSubmit(fakeToken, lastFour);
  }

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      <div style={{ textAlign: "center", marginBottom: "-0.25rem" }}>
        <span style={styles.demoBadge}>Demo Mode</span>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div>
        <label style={styles.label}>Card Number</label>
        <input
          style={styles.input}
          type="text"
          placeholder="4242 4242 4242 4242"
          value={number}
          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          maxLength={19}
          autoComplete="cc-number"
        />
      </div>

      <div style={styles.inputRow}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Expiry</label>
          <input
            style={styles.halfInput}
            type="text"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            autoComplete="cc-exp"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>CVC</label>
          <input
            style={styles.halfInput}
            type="text"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            autoComplete="cc-csc"
          />
        </div>
      </div>

      <button
        style={{
          ...styles.button,
          ...(submitting ? styles.buttonDisabled : {}),
        }}
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Adding..." : "Add Card"}
      </button>
    </form>
  );
}

function StripeCardForm({ onSubmit, submitting, error, success }) {
  const stripe = useStripe();
  const elements = useElements();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    const { token, error: stripeError } = await stripe.createToken(cardElement);

    if (stripeError) {
      onSubmit(null, null, stripeError.message);
      return;
    }

    onSubmit(token.id, token.card.last4);
  }

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <CardElementField />

      <button
        style={{
          ...styles.button,
          ...(submitting || !stripe ? styles.buttonDisabled : {}),
        }}
        type="submit"
        disabled={submitting || !stripe}
      >
        {submitting ? "Adding..." : "Add Card"}
      </button>
    </form>
  );
}

export default function AddCard() {
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
      setError("Invalid card data");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/payment-methods", {
        stripeToken: tokenId,
        type: "card",
        lastFour,
      });
      setSuccess("Card added successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Add Debit Card</h1>

      {hasStripe ? (
        <StripeCardForm
          onSubmit={handleToken}
          submitting={submitting}
          error={error}
          success={success}
        />
      ) : (
        <DemoCardForm
          onSubmit={handleToken}
          submitting={submitting}
          error={error}
          success={success}
        />
      )}
    </div>
  );
}
