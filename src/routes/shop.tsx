import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getBalance,
  getBalanceFormatted,
  getHistory,
  SHOP_ITEMS,
  setPendingPurchase,
  getPendingPurchase,
  confirmPendingPurchase,
  clearPendingPurchase,
} from "../lib/wallet";
import type { PurchaseRecord } from "../lib/wallet";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
});

function ShopPage() {
  const [balance, setBalance] = useState(getBalance());
  const [history, setHistory] = useState<PurchaseRecord[]>(getHistory());
  const [pending, setPending] = useState(getPendingPurchase());
  const [confirmed, setConfirmed] = useState<string | null>(null);

  // Check for pending purchases on mount
  useEffect(() => {
    const p = getPendingPurchase();
    setPending(p);
  }, []);

  const refresh = () => {
    setBalance(getBalance());
    setHistory(getHistory());
    setPending(getPendingPurchase());
  };

  const handleBuy = (item: (typeof SHOP_ITEMS)[0]) => {
    // Store the pending purchase
    setPendingPurchase({
      product: item.product,
      amount: item.amount,
      price: item.price,
      stripeUrl: item.stripeUrl,
      timestamp: Date.now(),
    });
    setPending(getPendingPurchase());

    // Open Stripe checkout in a new tab
    window.open(item.stripeUrl, "_blank", "noopener,noreferrer");
  };

  const handleConfirmPayment = () => {
    if (confirmPendingPurchase()) {
      setConfirmed(pending?.product ?? null);
      refresh();
      setTimeout(() => setConfirmed(null), 3000);
    }
  };

  const handleDismissPending = () => {
    clearPendingPurchase();
    setPending(null);
  };

  const cardItems = SHOP_ITEMS.filter((i) => i.category === "cards");
  const entryItems = SHOP_ITEMS.filter((i) => i.category === "entry");

  return (
    <div className="min-h-dvh bg-gradient-to-b from-bingo-dark via-red-950/10 to-bingo-dark pb-8">
      {/* Header Bar */}
      <div className="sticky top-16 z-30 border-b border-bingo-gold/20 bg-bingo-dark/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-xl font-bold text-white">
            <span className="text-bingo-gold">Cashier</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Balance:</span>
            <span className="text-lg font-bold text-bingo-gold">{getBalanceFormatted()}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        {/* Pending Payment Banner */}
        {pending && (
          <div className="mb-8 rounded-2xl border border-bingo-gold/30 bg-gradient-to-r from-bingo-gold/10 to-amber-900/20 p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-bingo-gold">Pending Purchase</h3>
                <p className="text-gray-300">
                  You have a pending purchase:{" "}
                  <span className="font-bold text-white">{pending.product}</span>
                  {" — "}
                  <span className="text-bingo-gold">${pending.price.toFixed(2)}</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Completed your Stripe payment? Click confirm below.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmPayment}
                  className="rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-2.5 font-bold text-white hover:from-green-500 hover:to-green-600 transition-all"
                >
                  ✓ I've Paid — Confirm
                </button>
                <button
                  onClick={handleDismissPending}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation toast */}
        {confirmed && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-green-700/80 to-green-800/80 p-4 text-center text-white font-bold animate-pulse">
            ✅ ${(pending?.price ?? 0).toFixed(2)} added to your balance! Enjoy your {confirmed}.
          </div>
        )}

        {/* Card Bundles Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-2xl">🎟️</span>
            <h2 className="text-2xl font-bold text-white">Card Bundles</h2>
          </div>
          <p className="mb-6 text-gray-400">
            Buy bingo cards to play in any game. Cards are added to your account balance.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {cardItems.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-bingo-gold/20 bg-gradient-to-b from-white/5 to-transparent p-6 transition-all hover:border-bingo-gold/50 hover:shadow-lg hover:shadow-bingo-gold/5"
              >
                <div className="text-center">
                  <span className="text-4xl">{item.icon}</span>
                  <h3 className="mt-3 text-lg font-bold text-white">{item.product}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-black text-bingo-gold">
                      ${item.price.toFixed(2)}
                    </span>
                    <p className="mt-1 text-xs text-gray-600">
                      ${(item.price / item.amount).toFixed(2)} per card
                    </p>
                  </div>
                  <button
                    onClick={() => handleBuy(item)}
                    className="btn-primary mt-6 w-full"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Game Entry Credits Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <h2 className="text-2xl font-bold text-white">Game Entry Credits</h2>
          </div>
          <p className="mb-6 text-gray-400">
            Buy entry credits to join specific game tiers. Entry fees are deducted from your balance
            when you join a game.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {entryItems.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 transition-all hover:border-bingo-gold/30"
              >
                <div className="text-center">
                  <span className="text-4xl">{item.icon}</span>
                  <h3 className="mt-3 text-lg font-bold text-white">{item.product}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-black text-bingo-gold">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuy(item)}
                    className="btn-ghost mt-6 w-full"
                  >
                    Buy Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Purchase History */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-white">Purchase History</h2>
          {history.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center">
              <span className="text-3xl">📭</span>
              <p className="mt-3 text-gray-500">No purchases yet. Buy some cards to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div>
                    <span className="font-medium text-white">{record.product}</span>
                    <span className="ml-2 text-xs text-gray-600">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-bold text-bingo-gold">
                    +${record.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
