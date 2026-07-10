import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
});

const faqs = [
  {
    q: "What errors can ClearScore AI find?",
    a: "Our AI scans your Equifax, Experian, and TransUnion credit reports for common errors including: late payments outside the 7-year reporting window, charge-offs or collections past the reporting limit, duplicate accounts, incorrect balances or credit limits, identity errors (accounts you don't recognize), outdated information (paid collections still showing as unpaid), and unauthorized hard inquiries. If the AI finds something it's not confident about, it will flag it for your review rather than filing a baseless dispute.",
  },
  {
    q: "How long does it take to see results?",
    a: "Most users see their first score improvement within 30–60 days. The credit bureaus have 30 days to investigate a dispute (with one 15-day extension if needed). Once an error is removed, your score can update within the next billing cycle. On average, our users see a 40+ point improvement within 90 days. Some errors are resolved faster — incorrect balances or duplicate accounts can be removed in as little as 2 weeks.",
  },
  {
    q: "Is it safe to use?",
    a: "Absolutely. ClearScore AI uses 256-bit encryption for all data in transit and at rest. We never store your Social Security number or financial account details. We only access your credit report data with your explicit permission, and you can revoke access at any time. Our dispute letters are FCRA-compliant and follow all federal regulations. We're also fully compliant with the Fair Credit Reporting Act (FCRA) and the Consumer Financial Protection Bureau (CFPB) guidelines.",
  },
  {
    q: "How does the AI dispute process work?",
    a: "Once you connect your credit reports, our AI analyzes each line item against known error patterns. For each potential error, it generates a personalized dispute letter citing the specific inaccuracy and the relevant FCRA provisions. You review each letter, approve it, and we send it to the appropriate bureau. The AI scores each dispute by confidence level so you know which ones are most likely to succeed. We then track the status of every dispute and notify you when the bureau responds.",
  },
  {
    q: "Do I need to cancel my current credit repair service?",
    a: "ClearScore AI is designed to be a complete replacement for traditional credit repair services. Unlike traditional services that charge hundreds upfront and take months to get started, we use AI to analyze your reports in minutes and generate disputes immediately. We recommend canceling any existing service once you've signed up with ClearScore AI — but there's no harm in trying us first while keeping your current service, since we don't require any long-term commitment.",
  },
  {
    q: "What if my dispute is denied?",
    a: "If a dispute is denied, the AI can help you escalate it. Often, a denial means the bureau needs more specific documentation. The AI can generate a follow-up letter with additional details or a different legal argument. Some disputes may need to be sent to the data furnisher (the original creditor) directly, which the AI can also handle. Our Premium plan includes priority escalation support. Remember: you can always dispute the same item again with new evidence under FCRA § 1681i(a)(4).",
  },
  {
    q: "Is my data secure?",
    a: "Security is our top priority. All data is encrypted with AES-256 both in transit (TLS 1.3) and at rest. We use bank-grade infrastructure hosted on AWS with SOC 2 compliance. We never share your personal information with third parties, and you can delete your account and all associated data at any time. Our session management uses HttpOnly cookies with CSRF protection, and all passwords are hashed using PBKDF2-SHA-512 — the same standard used by password managers. We also undergo regular third-party security audits.",
  },
];

function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg dark:border-gray-800/60 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-sm font-bold text-white">
              C
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              ClearScore <span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/about" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</Link>
            <Link to="/faq" className="text-sm font-medium text-indigo-600 dark:text-indigo-400">FAQ</Link>
            <Link to="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">Get Started Free</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate flex flex-col items-center overflow-hidden pt-28 pb-12 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.12),transparent)] dark:bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]" />
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">FAQ</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about ClearScore AI and credit repair.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="border-t border-gray-100 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-700 dark:bg-gray-900"
                >
                  <button
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-gray-900 pr-8 dark:text-white">
                      {faq.q}
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-6 pb-5 pt-4 dark:border-gray-800">
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Still have questions?</h2>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Get in touch — we're happy to help you understand how ClearScore AI works.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl"
          >
            Get Started Free
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-400 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} ClearScore AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}