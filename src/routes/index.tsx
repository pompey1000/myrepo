import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile, appendFile } from "node:fs/promises";
import { useState } from "react";

// --- Server functions ---

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

const submitWaitlist = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string }) => data)
  .handler(async ({ data }) => {
    const { name, email } = data;
    const entry = JSON.stringify({ name, email, timestamp: new Date().toISOString() }) + "\n";
    try {
      await appendFile("waitlist.json", entry);
      return { success: true };
    } catch {
      return { success: false, error: "Could not save entry" };
    }
  });

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

// --- Icons (inline SVGs for zero dependencies) ---

function CheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

// --- Components ---

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

// --- Landing Page ---

function Home() {
  const businessName = Route.useLoaderData();
  const [formState, setFormState] = useState<{ name: string; email: string }>({ name: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await submitWaitlist({ data: { name: formState.name.trim(), email: formState.email.trim() } });
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-dvh flex-col font-sans" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ========== HEADER ========== */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg dark:border-gray-800/60 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-sm font-bold text-white">
              C
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              ClearScore <span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <button onClick={() => scrollTo("how-it-works")} className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              How It Works
            </button>
            <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              Pricing
            </button>
            <ThemeToggle />
            <Link
              to="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Get Started Free
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950 md:hidden">
            <nav className="flex flex-col gap-3">
              <button onClick={() => scrollTo("how-it-works")} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                How It Works
              </button>
              <button onClick={() => scrollTo("pricing")} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                Pricing
              </button>
              <Link
                to="/signup"
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ========== HERO ========== */}
      <section className="relative isolate flex flex-col items-center overflow-hidden pt-28 pb-16 sm:pb-24 sm:pt-36">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.12),transparent)] dark:bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]" />

        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
            <SparklesIcon />
            AI-Powered Credit Repair
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
            Fix Your Credit{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              with AI
            </span>
            <br />
            in Minutes, Not Months
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl dark:text-gray-400">
            {businessName} scans your Equifax, Experian, and TransUnion reports for errors,
            automatically generates dispute letters, and tracks your score improvement —
            all without lawyers or paperwork headaches.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Get Started Free
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              How It Works
            </button>
          </div>

          {/* Trust stat badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckIcon />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900 dark:text-white">40+</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Score Improvement</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ShieldIcon />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900 dark:text-white">1 in 5</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reports Have Errors</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <DocumentIcon />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900 dark:text-white">10K+</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Disputes Filed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="border-t border-gray-100 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              From Error to Improvement in 4 Steps
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              No lawyers. No paperwork. No monthly subscriptions you don't need. Just smart AI that does the heavy lifting.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                <ShieldIcon />
              </div>
              <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                1
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Connect Your Reports</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Securely link your Equifax, Experian, and TransUnion accounts. We use bank-grade encryption.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50">
                <SparklesIcon />
              </div>
              <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                2
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">AI Scans for Errors</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Our AI finds charge-offs, late payments, incorrect balances, and identity errors across all three bureaus.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                <DocumentIcon />
              </div>
              <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                3
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Auto-Generate Disputes</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                One click generates professional dispute letters personalized to each bureau and error type, ready to send.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                <ChartIcon />
              </div>
              <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                4
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Track Your Score</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Watch your score climb with real-time tracking. Get notified when errors are removed and your score improves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="border-t border-gray-100 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              No hidden fees. No surprises. Cancel anytime.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {/* Starter */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Starter</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">$19</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Everything you need to start fixing your credit.</p>
              <ul className="mt-6 space-y-3">
                {["Full 3-bureau report analysis", "AI dispute letter generation", "Score tracking dashboard", "Email support"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/3cI00jaJb9vLdro0JFcwg09"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Get Started
              </a>
            </div>

            {/* Premium — featured */}
            <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-8 shadow-lg shadow-indigo-500/10 transition-all hover:shadow-xl dark:border-indigo-500 dark:bg-gray-900">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Premium</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">$39</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Serious about your credit? Go all-in with personalized guidance.</p>
              <ul className="mt-6 space-y-3">
                {["Everything in Starter", "Priority dispute processing", "Credit building recommendations", "Personal credit coaching", "Priority support"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/dRm5kD9F7gYd4US8c7cwg0a"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                Start Free Trial
              </a>
            </div>

            {/* One-Time Audit */}
            <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">One-Time Audit</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">$49</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">one-time</span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">A single deep dive into your credit reports with actionable insights.</p>
              <ul className="mt-6 space-y-3">
                {["Deep-dive 3-bureau analysis", "Error report with recommendations", "Personalized action plan", "No recurring charges"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/cNi5kDdVn23jevs1NJcwg0b"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Get Your Audit
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="border-t border-gray-100 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Real People, Real Results
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Join thousands of Americans who've taken control of their credit.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                "I found 3 errors on my credit report that I never would have caught. ClearScore AI did all the work — my score went up 52 points in 60 days."
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  SJ
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Sarah J.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Score: 612 → 664</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                "I was denied a mortgage because of an error on my Equifax report. ClearScore AI found it, filed the dispute, and it was removed in 3 weeks."
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  MK
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Marcus K.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Score: 580 → 640</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                "As a freelancer, my credit is everything. The credit building recommendations alone were worth it. I'm finally above 700 for the first time."
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  AL
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Aisha L.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Score: 638 → 712</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-60">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <ShieldIcon />
              256-bit Encryption
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              FTC Compliant
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              $0 Upfront
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Cancel Anytime
            </div>
          </div>
        </div>
      </section>

      {/* ========== WAITLIST / SIGNUP ========== */}
      <section id="waitlist" className="border-t border-gray-100 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Get Early Access
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Be among the first to experience AI-powered credit repair. Join the waitlist and get{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">20% off</span> your first 3 months.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-lg">
            {submitted ? (
              <div className="rounded-2xl bg-emerald-50 p-8 text-center dark:bg-emerald-900/20">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckIcon />
                </div>
                <h3 className="mt-4 text-xl font-bold text-emerald-800 dark:text-emerald-300">You're on the list!</h3>
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                  Thanks, {formState.name.split(" ")[0]}! We'll be in touch soon with early access details and your discount.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Email Address"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Joining..." : "Join the Waitlist"}
                </button>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  No spam. Unsubscribe anytime. Your data is encrypted and never shared.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-purple-600 text-xs font-bold text-white">
                C
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ClearScore <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
            </div>
            <nav className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#how-it-works" className="transition-colors hover:text-gray-900 dark:hover:text-white">
                How It Works
              </a>
              <a href="#pricing" className="transition-colors hover:text-gray-900 dark:hover:text-white">
                Pricing
              </a>
              <a href="#waitlist" className="transition-colors hover:text-gray-900 dark:hover:text-white">
                Waitlist
              </a>
            </nav>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            &copy; {new Date().getFullYear()} ClearScore AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
