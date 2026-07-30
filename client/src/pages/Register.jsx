import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("personal");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email, username, password, accountType);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "1.5rem",
        gap: "1.5rem",
        background: "#0a0a0a",
      }}
    >
      {/* Logo / Branding */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #00D632, #00e676)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontWeight: 900,
            fontSize: "2rem",
            boxShadow: "0 8px 32px rgba(0,214,50,0.25)",
          }}
        >
          $
        </div>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          QuickSplit
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "-0.25rem" }}>
          Create your account to get started.
        </p>
      </div>

      {/* Register Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#141414",
          borderRadius: "20px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          border: "1px solid #1e1e1e",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, textAlign: "center", color: "#fff" }}>
          Create Account
        </h2>

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

        <div>
          <label
            style={{
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: "0.35rem",
              paddingLeft: "2px",
            }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              border: "1px solid #222",
              background: "#0a0a0a",
              color: "#f0f0f0",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: "0.35rem",
              paddingLeft: "2px",
            }}
          >
            Username
          </label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              border: "1px solid #222",
              background: "#0a0a0a",
              color: "#f0f0f0",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: "0.35rem",
              paddingLeft: "2px",
            }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              border: "1px solid #222",
              background: "#0a0a0a",
              color: "#f0f0f0",
              fontSize: "1rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        {/* Account Type Selector */}
        <div>
          <label
            style={{
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: "0.5rem",
              paddingLeft: "2px",
            }}
          >
            Account Type
          </label>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setAccountType("personal")}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.9rem 0.75rem",
                borderRadius: "14px",
                border: accountType === "personal" ? "2px solid #00D632" : "2px solid #222",
                background: accountType === "personal" ? "rgba(0,214,50,0.08)" : "#0a0a0a",
                color: "#fff",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>👤</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Personal</span>
              <span style={{ fontSize: "0.65rem", color: "#666", lineHeight: 1.3 }}>
                For everyday payments between friends and family
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType("business")}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.9rem 0.75rem",
                borderRadius: "14px",
                border: accountType === "business" ? "2px solid #00D632" : "2px solid #222",
                background: accountType === "business" ? "rgba(0,214,50,0.08)" : "#0a0a0a",
                color: "#fff",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>🏢</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Business</span>
              <span style={{ fontSize: "0.65rem", color: "#666", lineHeight: 1.3 }}>
                For merchants, freelancers, and companies
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "0.9rem",
            borderRadius: "12px",
            border: "none",
            background: submitting ? "#1a4d2a" : "#00D632",
            color: "#000",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            marginTop: "0.25rem",
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow: submitting ? "none" : "0 4px 16px rgba(0,214,50,0.2)",
          }}
        >
          {submitting ? "Creating account..." : "Sign Up"}
        </button>

        <div style={{ textAlign: "center" }}>
          <a
            href="#login"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#login";
              window.dispatchEvent(new Event("hashchange"));
            }}
            style={{
              color: "#00D632",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Already have an account? Log in
          </a>
        </div>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "#555" }}>
            By continuing, you agree to our{" "}
          </span>
          <a
            href="#terms"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#terms";
              window.dispatchEvent(new Event("hashchange"));
            }}
            style={{
              color: "#00D632",
              textDecoration: "none",
              fontSize: "0.72rem",
              fontWeight: 500,
            }}
          >
            Terms &amp; Conditions
          </a>
        </div>
      </form>
    </div>
  );
}
