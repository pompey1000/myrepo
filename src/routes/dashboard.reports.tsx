import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { getReportsData } from "~/lib/api";
import type { ReportsData } from "~/lib/api";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsPage,
  loader: async () => getReportsData(),
});

const INITIAL: ReportsData = {
  reports: [
    { bureau: "Equifax", status: "pending", score: null, lastUpdated: "Not yet connected" },
    { bureau: "Experian", status: "pending", score: null, lastUpdated: "Not yet connected" },
    { bureau: "TransUnion", status: "pending", score: null, lastUpdated: "Not yet connected" },
  ],
  errorStats: { errors: 0, ready: 0, resolved: 0 },
};

function ReportsPage() {
  const loaderData = Route.useLoaderData();
  const [dragOver, setDragOver] = useState(false);
  const data = loaderData ?? INITIAL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Credit Reports
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Connect and manage your credit bureau reports
        </p>
      </div>

      {/* Bureau connection cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {data.reports.map((report) => (
          <div
            key={report.bureau}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-gray-800"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {report.bureau}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  report.status === "connected"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    report.status === "connected" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {report.status === "connected" ? "Connected" : "Pending"}
              </span>
            </div>
            {report.score ? (
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {report.score}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated {report.lastUpdated}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Not connected
                </p>
                <button className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700">
                  Connect
                </button>
              </div>
            )}
            {report.status === "connected" && (
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  Refresh
                </button>
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  View Report
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload section */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Upload Credit Report
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Upload a PDF of your credit report for AI analysis
        </p>

        <div
          className={`mt-4 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/30"
              : "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
        >
          <svg
            className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {dragOver
              ? "Drop your file here"
              : "Drag and drop your report PDF, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            PDF files only, up to 10MB
          </p>
          <button className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">
            Browse Files
          </button>
        </div>
      </div>

      {/* AI Analysis Summary */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            AI Analysis Summary
          </h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {data.errorStats.errors}
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">Errors Detected</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {data.errorStats.ready}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-300">Ready to Dispute</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {data.errorStats.resolved}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-300">Resolved</p>
          </div>
        </div>
      </div>
    </div>
  );
}