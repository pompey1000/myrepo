import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";
import ChatWidget from "~/components/ChatWidget";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ClearScore AI — AI-Powered Credit Repair" },
      {
        name: "description",
        content:
          "ClearScore AI scans your Equifax, Experian, and TransUnion credit reports for errors, generates dispute letters automatically, and tracks your score improvement. Fix your credit in minutes.",
      },
      { name: "keywords", content: "credit repair, AI credit repair, dispute letters, credit score, credit report errors" },
      { property: "og:title", content: "ClearScore AI — AI-Powered Credit Repair" },
      {
        property: "og:description",
        content: "Fix errors on your credit reports automatically with AI. No lawyers, no paperwork. Save thousands in interest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ClearScore AI — AI-Powered Credit Repair" },
      {
        name: "twitter:description",
        content: "Fix errors on your credit reports automatically with AI. No lawyers, no paperwork.",
      },
      {
        type: "application/ld+json",
        content: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ClearScore AI",
          applicationCategory: "FinanceApplication",
          description:
            "AI-powered credit repair that scans credit reports for errors, generates dispute letters, and tracks score improvement.",
          offers: [
            { "@type": "Offer", price: "19", priceCurrency: "USD", description: "Monthly subscription" },
            { "@type": "Offer", price: "39", priceCurrency: "USD", description: "Premium subscription" },
            { "@type": "Offer", price: "49", priceCurrency: "USD", description: "One-time report audit" },
          ],
        }),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  notFoundComponent: () => <div>Page not found</div>,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Dark mode initialization script — runs before paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ChatWidget />
        <Scripts />
      </body>
    </html>
  );
}