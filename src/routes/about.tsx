import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
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
            <Link to="/about" className="text-sm font-medium text-indigo-600 dark:text-indigo-400">About</Link>
            <Link to="/faq" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">FAQ</Link>
            <Link to="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">Get Started Free</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate flex flex-col items-center overflow-hidden pt-28 pb-16 sm:pb-20 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.12),transparent)] dark:bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">About ClearScore AI</span>
          <h1 className="mt-6 max-w-3xl mx-auto text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
            Fix Your Credit{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Fast with AI</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            We believe everyone deserves a fair shot at good credit. ClearScore AI uses artificial intelligence to find errors on your credit reports, generate dispute letters, and help you improve your score — without expensive lawyers or confusing paperwork.
          </p>
        </div>
      </section>

      {/* How we help */}
      <section className="border-t border-gray-100 bg-white py-16 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">How We Help</h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">Four ways ClearScore AI makes credit repair simple</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: "🔍", title: "Scan All 3 Bureaus", desc: "We analyze your Equifax, Experian, and TransUnion reports for errors that are hurting your score." },
              { emoji: "🤖", title: "AI-Powered Detection", desc: "Our AI finds late payments, charge-offs, incorrect balances, identity errors, and more." },
              { emoji: "✍️", title: "Auto-Generate Disputes", desc: "One click creates professional FCRA-compliant dispute letters personalized to each error." },
              { emoji: "📈", title: "Track Improvement", desc: "Monitor your score over time and get notified when errors are removed." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                <div className="text-3xl">{item.emoji}</div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">The Process</h2>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-400">From signup to score improvement in a few simple steps</p>
            <div className="mt-10 space-y-6">
              {[
                { step: "1", title: "Sign Up", desc: "Create your free account in 30 seconds. No credit card required." },
                { step: "2", title: "Connect Your Reports", desc: "Securely link your Equifax, Experian, and TransUnion credit reports." },
                { step: "3", title: "AI Analysis", desc: "Our AI scans your reports and identifies every error worth disputing." },
                { step: "4", title: "File Disputes", desc: "Review and approve AI-generated dispute letters, then send them with one click." },
                { step: "5", title: "Watch Your Score Grow", desc: "Track your progress as errors are removed and your score improves." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">{item.step}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-white py-16 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Ready to fix your credit?</h2>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">Join thousands of Americans who've taken control of their credit with AI.</p>
          <Link to="/signup" className="mt-8 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl">
            Get Started Free
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-400 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} ClearScore AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}