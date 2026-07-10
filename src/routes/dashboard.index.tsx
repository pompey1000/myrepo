import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { getDashboardData } from "~/lib/api";
import type { DashboardData } from "~/lib/api";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  loader: async () => getDashboardData(),
});

const INITIAL: DashboardData = {
  score: 648,
  scoreChange: 36,
  ficoScore: 642,
  vantageScore: 655,
  factors: [],
  recentActivity: [],
  recentScores: [],
};

function DashboardHome() {
  const data = Route.useLoaderData();
  const [dashboard] = useState<DashboardData>(data ?? INITIAL);

  const scoreColor =
    dashboard.score >= 700
      ? "text-emerald-500"
      : dashboard.score >= 620
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Your credit health at a glance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Credit Score
            </h2>
            <div className="mt-4 flex items-baseline gap-1">
              <span className={`text-5xl font-extrabold tracking-tight ${scoreColor}`}>
                {dashboard.score}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ 850</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <svg
                className={`h-4 w-4 ${dashboard.scoreChange >= 0 ? "text-emerald-500" : "text-red-500"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    dashboard.scoreChange >= 0
                      ? "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                      : "M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306-3.09M20.25 21v-5.25m0 0l-3 3m3-3l3 3"
                  }
                />
              </svg>
              <span
                className={`text-sm font-medium ${dashboard.scoreChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              >
                {dashboard.scoreChange >= 0 ? "+" : ""}
                {dashboard.scoreChange} points
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                since joining
              </span>
            </div>

            {/* Score gauge */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                  style={{ width: `${(dashboard.score / 850) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fair Isaac (FICO)
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {dashboard.ficoScore}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  VantageScore
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {dashboard.vantageScore}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Score factors + Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Score Factors */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Score Factors
            </h2>
            <div className="mt-4 space-y-3">
              {dashboard.factors.map((factor) => (
                <div key={factor.name} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-gray-700 dark:text-gray-300">
                    {factor.name}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full ${
                          factor.status === "excellent"
                            ? "bg-emerald-500"
                            : factor.status === "good"
                              ? "bg-blue-500"
                              : factor.status === "fair"
                                ? "bg-amber-500"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${(factor.score / factor.max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {factor.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Recent Activity
            </h2>
            <div className="mt-4 space-y-3">
              {dashboard.recentActivity.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No recent activity yet.
                </p>
              )}
              {dashboard.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      activity.status === "complete"
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : activity.status === "alert"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-amber-100 dark:bg-amber-900/30"
                    }`}
                  >
                    {activity.status === "complete" ? (
                      <svg
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : activity.status === "alert" ? (
                      <svg
                        className="h-4 w-4 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 text-amber-600 dark:text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.date}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      activity.status === "complete"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : activity.status === "alert"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {activity.status === "in-progress" ? "in progress" : activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score Trend */}
      {dashboard.recentScores.length > 1 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Score Trend
          </h2>
          <div className="mt-4 flex items-end gap-2">
            {dashboard.recentScores.map((s, i) => {
              const minScore = Math.min(...dashboard.recentScores.map((x) => x.score));
              const maxScore = Math.max(...dashboard.recentScores.map((x) => x.score));
              const range = maxScore - minScore || 1;
              const height = ((s.score - minScore) / range) * 100 + 20;
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {s.score}
                  </span>
                  <div
                    className="mt-1 w-full rounded-t bg-gradient-to-t from-indigo-500 to-indigo-400"
                    style={{ height: `${height}px`, minHeight: "24px" }}
                  />
                  <span className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    {s.recorded_at.slice(5, 10)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Getting Started Checklist */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Getting Started
          </h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "Upload your credit reports",
              desc: "Connect Equifax, Experian, and TransUnion",
              done: dashboard.recentScores.length > 0,
            },
            {
              title: "Review detected errors",
              desc: "Check what the AI found across your reports",
              done: false,
            },
            {
              title: "Generate dispute letters",
              desc: "File disputes with one click",
              done: false,
            },
            {
              title: "Track score improvement",
              desc: "Watch your progress over time",
              done: dashboard.recentScores.length >= 2,
            },
          ].map((step) => (
            <div
              key={step.title}
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                step.done
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-gray-300 dark:border-gray-600"
                }`}
              >
                {step.done && (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    step.done
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}