import { ReactNode, useState, useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "../styles/app.css?url";
import { getBalance, getBalanceFormatted } from "../lib/wallet";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BingoJackpot" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-bingo-gold">404</h1>
        <p className="mt-4 text-gray-400">Page not found</p>
        <a href="/" className="btn-primary mt-6 inline-block">Go Home</a>
      </div>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setBalance(getBalance());
    // Refresh balance every 2 seconds (in case of manual confirm from shop)
    const interval = setInterval(() => setBalance(getBalance()), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bingo-dark">
        <header className="fixed top-0 left-0 right-0 z-40 bg-bingo-dark/95 backdrop-blur-sm border-b border-bingo-gold/20">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🎱</span>
              <span className="text-xl font-bold text-bingo-gold">BingoJackpot</span>
            </a>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="/" className="nav-link text-sm sm:text-base">Home</a>
              <a href="/#games" className="nav-link text-sm sm:text-base">Games</a>
              <a href="/shop" className="nav-link text-sm sm:text-base">Shop</a>
              <a href="#" className="nav-link text-sm sm:text-base hidden sm:inline">How to Play</a>
              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <span className="text-xs text-gray-500 hidden sm:inline">Balance</span>
                <span className="text-sm sm:text-base font-bold text-bingo-gold">
                  {getBalanceFormatted()}
                </span>
                <a
                  href="/shop"
                  className="rounded-lg bg-bingo-gold/20 px-2.5 py-1 text-xs font-bold text-bingo-gold hover:bg-bingo-gold/30 transition-all"
                >
                  + Top Up
                </a>
              </div>
            </div>
          </nav>
        </header>
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
