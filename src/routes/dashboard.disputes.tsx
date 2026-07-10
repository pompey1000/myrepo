import { createFileRoute } from "@tanstack/react-router";

import { getDisputesData } from "~/lib/api";
import type { DisputesData } from "~/lib/api";

export const Route = createFileRoute("/dashboard/disputes")({
  component: DisputesPage,
  loader: async () => getDisputesData(),
});

const INITIAL: DisputesData = {
  active: [],
  resolved: [],
  stats: { total: 0, active: 0, resolved: 0, potentialGain: 0 },
};

const statusConfig: Record<
  string,
  { label: string; bg: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  in_review: {
    label: "In Review",
    bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  won: {
    label: "Resolved",
    bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  lost: {
    label: "Lost",
    bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  escalated: {
    label: "Escalated",
    bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

function DisputesPage() {
  const loaderData = Route.useLoaderData();
  const data = loaderData ?? INITIAL;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Disputes
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track and manage your credit report disputes
          </p>
        </div>
        <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">
          + New Dispute
        </button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.stats.total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Disputes</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {data.stats.active}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {data.stats.resolved}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Resolved</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            +{data.stats.potentialGain}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Potential Score Gain
          </p>
        </div>
      </div>

      {/* Active disputes */}
      {data.active.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Active Disputes
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.active.map((dispute) => {
              const config = statusConfig[dispute.status] ?? statusConfig.draft;
              return (
                <div
                  key={dispute.id}
                  className="p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {dispute.id}
                        </span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {dispute.bureau}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-white">
                        {dispute.error}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Filed: {dispute.filed}</span>
                        <span>Est. resolution: {dispute.estimatedResolution}</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{dispute.scoreImpact} pts potential
                        </span>
                      </div>
                    </div>
                    <button className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No active disputes */}
      {data.active.length === 0 && data.stats.total > 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <svg
            className="mx-auto h-10 w-10 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
            All disputes resolved!
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Great work — there are no active disputes right now.
          </p>
        </div>
      )}

      {/* No disputes at all */}
      {data.stats.total === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
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
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
            No disputes yet
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload a credit report and run an AI analysis to find errors worth disputing.
          </p>
        </div>
      )}

      {/* Resolved disputes */}
      {data.resolved.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Resolved Disputes
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.resolved.map((dispute) => {
              const config = statusConfig[dispute.status] ?? statusConfig.won;
              return (
                <div
                  key={dispute.id}
                  className="p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {dispute.id}
                        </span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {dispute.bureau}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-white">
                        {dispute.error}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Filed: {dispute.filed}</span>
                        {dispute.resolution && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Resolution: {dispute.resolution}
                          </span>
                        )}
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{dispute.scoreImpact} pts
                        </span>
                      </div>
                    </div>
                    <button className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}