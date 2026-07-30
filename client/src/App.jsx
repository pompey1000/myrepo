import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { StripeProvider } from "./components/StripeProvider.jsx";
import { apiGet } from "./api.js";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PaymentMethods from "./pages/PaymentMethods.jsx";
import AddCard from "./pages/AddCard.jsx";
import AddBank from "./pages/AddBank.jsx";
import SendMoney from "./pages/SendMoney.jsx";
import SendConfirmation from "./pages/SendConfirmation.jsx";
import History from "./pages/History.jsx";
import Withdraw from "./pages/Withdraw.jsx";
import Premium from "./pages/Premium.jsx";
import About from "./pages/About.jsx";
import Terms from "./pages/Terms.jsx";

const TABS = [
  { hash: "", label: "Home", icon: "🏠" },
  { hash: "#send", label: "Send", icon: "💸" },
  { hash: "#history", label: "History", icon: "📋" },
  { hash: "#payment-methods", label: "Cards", icon: "💳" },
];

function formatCompact(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState("home");
  const [balanceCents, setBalanceCents] = useState(null);
  const [pageKey, setPageKey] = useState(0); // trigger re-mount on nav

  // Fetch balance for header
  useEffect(() => {
    if (!user) return;
    apiGet("/users/me/balance")
      .then((data) => setBalanceCents(data.balanceCents))
      .catch(() => setBalanceCents(null));
  }, [user]);

  // Listen for hash changes for navigation
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      if (hash === "register") setPage("register");
      else if (hash === "login") setPage("login");
      else if (hash === "payment-methods") setPage("payment-methods");
      else if (hash === "add-card") setPage("add-card");
      else if (hash === "add-bank") setPage("add-bank");
      else if (hash === "send") setPage("send");
      else if (hash === "send-confirm") setPage("send-confirm");
      else if (hash === "history") setPage("history");
      else if (hash === "withdraw") setPage("withdraw");
      else if (hash === "premium") setPage("premium");
      else if (hash === "about") setPage("about");
      else if (hash === "terms") setPage("terms");
      else setPage("home");
      setPageKey((k) => k + 1);
    }
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((hash) => {
    window.location.hash = hash;
    window.dispatchEvent(new Event("hashchange"));
  }, []);

  // Refresh balance after a home navigation (maybe a transaction changed it)
  const refreshBalance = useCallback(() => {
    if (!user) return;
    apiGet("/users/me/balance")
      .then((data) => setBalanceCents(data.balanceCents))
      .catch(() => {});
  }, [user]);

  const isSubPage = page === "add-card" || page === "add-bank" || page === "send-confirm" || page === "withdraw" || page === "premium" || page === "about" || page === "terms";
  const isTabPage = page === "home" || page === "send" || page === "history" || page === "payment-methods";

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "#888",
          fontSize: "1.1rem",
          background: "#0a0a0a",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "2rem" }}>💸</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Authenticated — show app pages
  if (user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          maxWidth: "480px",
          margin: "0 auto",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* Header */}
        {!isSubPage && (
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1.25rem",
              background: "#0a0a0a",
              borderBottom: "1px solid #1a1a1a",
              zIndex: 10,
              minHeight: "52px",
            }}
          >
            {/* Brand */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
              }}
              onClick={() => navigate("")}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--accent-gradient, linear-gradient(135deg, #00D632, #00e676))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: "1.3rem",
                }}
              >
                💸
              </div>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                QuickSplit
              </span>
            </div>

            {/* Balance + Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {balanceCents !== null && (
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#00D632",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("")}
                >
                  {formatCompact(balanceCents)}
                </span>
              )}
              <button
                onClick={logout}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1px solid #333",
                  background: "#141414",
                  color: "#888",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Log out"
              >
                ⏻
              </button>
            </div>
          </header>
        )}

        {/* Sub-page back button */}
        {isSubPage && (
          <header
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.75rem 1.25rem",
              background: "#0a0a0a",
              borderBottom: "1px solid #1a1a1a",
              minHeight: "52px",
              gap: "0.75rem",
            }}
          >
            <button
              onClick={() => {
                if (page === "send-confirm" || page === "withdraw" || page === "premium" || page === "about" || page === "terms") navigate("");
                else navigate("#payment-methods");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#00D632",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "4px 8px",
                display: "flex",
                alignItems: "center",
              }}
            >
              ← Back
            </button>
            <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>
              {page === "add-card" ? "Add Card" : page === "add-bank" ? "Add Bank" : page === "withdraw" ? "Withdraw" : page === "premium" ? "Premium" : page === "about" ? "About" : page === "terms" ? "Terms & Conditions" : "Confirmation"}
            </span>
          </header>
        )}

        {/* Page content */}
        <main
          key={pageKey}
          className="page-enter"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: isTabPage ? "80px" : "1rem",
          }}
        >
          {page === "payment-methods" ? (
            <PaymentMethods onBalanceChange={refreshBalance} />
          ) : page === "add-card" ? (
            <AddCard />
          ) : page === "add-bank" ? (
            <AddBank />
          ) : page === "send" ? (
            <SendMoney onBalanceChange={refreshBalance} />
          ) : page === "send-confirm" ? (
            <SendConfirmation />
          ) : page === "history" ? (
            <History />
          ) : page === "withdraw" ? (
            <Withdraw onBalanceChange={refreshBalance} />
          ) : page === "premium" ? (
            <Premium />
          ) : page === "about" ? (
            <About />
          ) : page === "terms" ? (
            <Terms />
          ) : (
            <Home onBalanceChange={setBalanceCents} />
          )}
        </main>

        {/* Bottom tab bar */}
        {isTabPage && (
          <nav
            style={{
              position: "fixed",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              padding: "0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom, 0px))",
              background: "#0a0a0a",
              borderTop: "1px solid #1a1a1a",
              zIndex: 20,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {TABS.map((tab) => {
              const active =
                (tab.hash === "" && page === "home") ||
                (tab.hash !== "" && page === tab.hash.replace("#", ""));
              return (
                <button
                  key={tab.hash}
                  onClick={() => navigate(tab.hash)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    padding: "0.4rem 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: active ? "#00D632" : "#555",
                    fontSize: "0.7rem",
                    fontWeight: active ? 600 : 400,
                    transition: "color 0.2s ease",
                    position: "relative",
                    minHeight: "48px",
                  }}
                >
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        width: "24px",
                        height: "3px",
                        borderRadius: "3px",
                        background: "#00D632",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    );
  }

  // Unauthenticated — show login, register, or about
  if (page === "register") {
    return <Register />;
  }
  if (page === "about") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          maxWidth: "480px",
          margin: "0 auto",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0.75rem 1.25rem",
            background: "#0a0a0a",
            borderBottom: "1px solid #1a1a1a",
            minHeight: "52px",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={() => {
              window.location.hash = "";
              window.dispatchEvent(new Event("hashchange"));
            }}
            style={{
              background: "none",
              border: "none",
              color: "#00D632",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>About</span>
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>
          <About />
        </main>
      </div>
    );
  }
  if (page === "terms") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          maxWidth: "480px",
          margin: "0 auto",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0.75rem 1.25rem",
            background: "#0a0a0a",
            borderBottom: "1px solid #1a1a1a",
            minHeight: "52px",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={() => {
              window.location.hash = "";
              window.dispatchEvent(new Event("hashchange"));
            }}
            style={{
              background: "none",
              border: "none",
              color: "#00D632",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>Terms &amp; Conditions</span>
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Terms />
        </main>
      </div>
    );
  }
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <StripeProvider>
        <AppContent />
      </StripeProvider>
    </AuthProvider>
  );
}
