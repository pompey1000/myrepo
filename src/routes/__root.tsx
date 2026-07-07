import { ReactNode } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "../styles/app.css?url";

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
            <div className="flex items-center gap-6">
              <a href="/" className="nav-link">Home</a>
              <a href="/#games" className="nav-link">Games</a>
              <a href="#" className="nav-link">Shop</a>
              <a href="#" className="nav-link">How to Play</a>
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
