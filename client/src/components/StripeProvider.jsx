import { createContext, useContext, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const StripeContext = createContext(null);

const stripeKey = window.QUICKSPLIT_STRIPE_KEY || "";

let stripePromise = null;
if (stripeKey) {
  stripePromise = loadStripe(stripeKey);
}

export function StripeProvider({ children }) {
  const hasStripe = Boolean(stripeKey);

  const value = useMemo(() => ({ hasStripe, stripeKey }), []);

  if (hasStripe && stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <StripeContext.Provider value={value}>{children}</StripeContext.Provider>
      </Elements>
    );
  }

  return (
    <StripeContext.Provider value={value}>{children}</StripeContext.Provider>
  );
}

export function useStripeContext() {
  const ctx = useContext(StripeContext);
  if (!ctx) throw new Error("useStripeContext must be used within StripeProvider");
  return ctx;
}
