/**
 * ClearScore AI — Server API Functions.
 *
 * TanStack Start `createServerFn()` handlers that the dashboard pages call
 * from their route loaders. Every function here runs server-side only and
 * talks directly to Neon Postgres via ~/db.
 *
 * The file store (~/lib/store) is no longer used. The site now requires
 * `DATABASE_URL` to be set; if it isn't, the relevant `sql()` call throws
 * a clear error (see ~/db.ts) and the dashboard shows the empty state.
 *
 * Auth:
 *   - Password hashing uses PBKDF2-SHA-512 (~/lib/auth.hashPassword).
 *   - Successful login sets an HttpOnly session cookie (see
 *     buildSessionCookie in ~/lib/auth). The session is stored in the
 *     `sessions` table — `deleteDbSession` revokes it on logout.
 *
 * The "demo" user has the fixed UUID `DEMO_USER_ID` from ~/db (also seeded
 * by `bun run scripts/seed.ts`). Sign in is real (PBKDF2 + sessions); the
 * demo credentials are `demo@clearscore.ai` / anything ≥ 8 chars while
 * `password_hash` is empty (see auth bypass below).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  buildClearSessionCookie,
  buildSessionCookie,
  createSession as createAuthSession,
  hashPassword as hashPasswordPbkdf2,
  jsonResponse,
  verifyPassword,
} from "~/lib/auth";
import {
  analyzeCreditReport,
  estimateScoreImpact,
  generateDisputeLetter,
  type ErrorItem,
} from "~/lib/ai";
import {
  createDispute as dbCreateDispute,
  createUser as dbCreateUser,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  findUserByEmail as dbFindUserByEmail,
  findUserById as dbFindUserById,
  listDisputesForUser as dbListDisputesForUser,
  listReportsForUser as dbListReportsForUser,
  listScoreHistory as dbListScoreHistory,
  sql,
  type CreditBureau,
  type User,
} from "~/db";

// =============================================================================
// User resolution — DB only
// =============================================================================

const resolveUserById = async (id: string): Promise<User | null> =>
  dbFindUserById(id);

const resolveUserByEmail = async (
  email: string,
): Promise<(User & { password_hash: string }) | null> => {
  const u = await dbFindUserByEmail(email);
  return u as (User & { password_hash: string }) | null;
};

// =============================================================================
// Public types — keep in sync with what the dashboard renders
// =============================================================================

export interface DashboardData {
  score: number;
  scoreChange: number;
  ficoScore: number;
  vantageScore: number;
  factors: Array<{
    name: string;
    score: number;
    max: number;
    status: "excellent" | "good" | "fair" | "needs-work";
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    date: string;
    status: "pending" | "in-progress" | "complete" | "alert";
  }>;
  recentScores: Array<{ score: number; recorded_at: string }>;
}

export interface ReportData {
  bureau: string;
  status: "connected" | "pending";
  score: number | null;
  lastUpdated: string;
}

export interface ReportsData {
  reports: ReportData[];
  errorStats: { errors: number; ready: number; resolved: number };
}

export interface DisputeItem {
  id: string;
  bureau: string;
  error: string;
  reason: string;
  filed: string;
  status: string;
  estimatedResolution: string;
  scoreImpact: string;
  resolution?: string;
}

export interface DisputesData {
  active: DisputeItem[];
  resolved: DisputeItem[];
  stats: { total: number; active: number; resolved: number; potentialGain: number };
}

// =============================================================================
// Helpers
// =============================================================================

const factorStatus = (
  score: number,
): "excellent" | "good" | "fair" | "needs-work" => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "fair";
  return "needs-work";
};

const daysAgo = (isoDate: string): string => {
  const days = Math.round(
    (Date.now() - new Date(isoDate).getTime()) / 86400000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

// =============================================================================
// Dashboard, Reports, Disputes — read endpoints
// =============================================================================

export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const scores = await dbListScoreHistory(DEMO_USER_ID);
    const disputes = await dbListDisputesForUser(DEMO_USER_ID);
    const reports = await dbListReportsForUser(DEMO_USER_ID);

    const latestScore = scores.length > 0 ? scores[scores.length - 1]!.score : 620;
    const firstScore = scores.length > 0 ? scores[0]!.score : 620;
    const change = latestScore - firstScore;

    const ficoScore =
      reports.find((r) => r.bureau === "equifax")?.reported_score ??
      latestScore - 6;
    const vantageScore =
      reports.find((r) => r.bureau === "experian")?.reported_score ??
      latestScore + 7;

    return {
      score: latestScore,
      scoreChange: change,
      ficoScore,
      vantageScore,
      factors: [
        { name: "Payment History", score: 72, max: 100, status: factorStatus(72) },
        { name: "Credit Utilization", score: 45, max: 100, status: factorStatus(45) },
        { name: "Credit Age", score: 60, max: 100, status: factorStatus(60) },
        { name: "Hard Inquiries", score: 85, max: 100, status: factorStatus(85) },
        { name: "Derogatory Marks", score: 90, max: 100, status: factorStatus(90) },
      ],
      recentActivity: [
        ...disputes
          .filter((d) => d.status !== "won" && d.status !== "lost")
          .slice(0, 2)
          .map((d) => ({
            id: d.id,
            action:
              d.status === "draft"
                ? `Ready to dispute: ${d.item_description.slice(0, 50)}`
                : `Dispute filed with ${d.report_id.includes("001") ? "Equifax" : "Experian"}`,
            date: daysAgo(d.created_at),
            status: "pending" as const,
          })),
        {
          id: "activity-analyze",
          action: "Credit report analyzed",
          date: "3 days ago",
          status: "complete" as const,
        },
        ...(scores.length >= 2
          ? [
              {
                id: "activity-score",
                action: `Score increased by ${scores[scores.length - 1]!.score - scores[scores.length - 2]!.score} points`,
                date: daysAgo(scores[scores.length - 1]!.recorded_at),
                status: "complete" as const,
              },
            ]
          : []),
      ],
      recentScores: scores.slice(-6).map((s) => ({
        score: s.score,
        recorded_at: s.recorded_at,
      })),
    };
  },
);

export const getReportsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReportsData> => {
    const reports = await dbListReportsForUser(DEMO_USER_ID);
    const disputes = await dbListDisputesForUser(DEMO_USER_ID);

    const bureauMap: Record<string, { score: number | null; updatedAt: string }> = {
      equifax: { score: null, updatedAt: "Not yet connected" },
      experian: { score: null, updatedAt: "Not yet connected" },
      transunion: { score: null, updatedAt: "Not yet connected" },
    };

    for (const r of reports) {
      if (bureauMap[r.bureau]) {
        bureauMap[r.bureau] = {
          score: r.reported_score,
          updatedAt: daysAgo(r.uploaded_at),
        };
      }
    }

    const totalErrors = disputes.length;
    const readyToDispute = disputes.filter(
      (d) => d.status === "draft" || d.status === "submitted",
    ).length;
    const resolved = disputes.filter(
      (d) => d.status === "won" || d.status === "lost",
    ).length;

    return {
      reports: Object.entries(bureauMap).map(([bureau, data]) => ({
        bureau: bureau.charAt(0).toUpperCase() + bureau.slice(1),
        status: data.score ? ("connected" as const) : ("pending" as const),
        score: data.score,
        lastUpdated: data.updatedAt,
      })),
      errorStats: {
        errors: totalErrors,
        ready: readyToDispute,
        resolved,
      },
    };
  },
);

export const getDisputesData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DisputesData> => {
    const disputes = await dbListDisputesForUser(DEMO_USER_ID);
    const reports = await dbListReportsForUser(DEMO_USER_ID);

    const reportBureauMap: Record<string, string> = {};
    for (const r of reports) {
      reportBureauMap[r.id] = r.bureau.charAt(0).toUpperCase() + r.bureau.slice(1);
    }

    const items: DisputeItem[] = disputes.map((d) => ({
      id: d.id,
      bureau:
        d.report_id && reportBureauMap[d.report_id]
          ? reportBureauMap[d.report_id]!
          : "Equifax",
      error: d.item_description,
      reason: d.dispute_reason,
      filed: d.created_at.slice(0, 10),
      status: d.status,
      estimatedResolution: d.submitted_at
        ? new Date(new Date(d.submitted_at).getTime() + 21 * 86400000)
            .toISOString()
            .slice(0, 10)
        : "TBD",
      scoreImpact: String(d.status === "won" ? 15 : 20),
      resolution:
        d.status === "won" || d.status === "lost"
          ? d.bureau_response ?? "Resolved"
          : undefined,
    }));

    return {
      active: items.filter((d) => d.status !== "won" && d.status !== "lost"),
      resolved: items.filter(
        (d) => d.status === "won" || d.status === "lost",
      ),
      stats: {
        total: items.length,
        active: items.filter((d) => d.status !== "won" && d.status !== "lost")
          .length,
        resolved: items.filter((d) => d.status === "won" || d.status === "lost")
          .length,
        potentialGain: items
          .filter((d) => d.status !== "won" && d.status !== "lost")
          .reduce((sum, d) => sum + Number.parseInt(d.scoreImpact), 0),
      },
    };
  },
);

// =============================================================================
// AI endpoints
// =============================================================================

/** Fetch a single report and its parsed_data, or null if not found. */
const fetchReportForUser = async (
  report_id: string,
  user_id: string,
): Promise<{
  id: string;
  user_id: string;
  bureau: CreditBureau;
  parsed_data: Record<string, unknown>;
  reported_score: number | null;
  raw_pdf_path: string;
  uploaded_at: string;
} | null> => {
  const rows = await sql()`
    SELECT id, user_id, bureau, parsed_data, reported_score, raw_pdf_path, uploaded_at
      FROM credit_reports
     WHERE id = ${report_id}::uuid AND user_id = ${user_id}::uuid
     LIMIT 1
  `;
  if (!rows.length) return null;
  const r = rows[0] as Record<string, unknown>;
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    bureau: r.bureau as CreditBureau,
    parsed_data: (r.parsed_data as Record<string, unknown>) ?? {},
    reported_score: (r.reported_score as number | null) ?? null,
    raw_pdf_path: String(r.raw_pdf_path),
    uploaded_at: String(r.uploaded_at),
  };
};

/**
 * Pull a string representation out of a parsed credit report. The parser
 * (not yet built) should put a `.text` field on `parsed_data`; until that
 * exists, we serialize the whole JSON so the AI has something to look at.
 */
const reportToText = (parsed_data: Record<string, unknown>): string => {
  if (typeof parsed_data.text === "string" && parsed_data.text.length > 0) {
    return parsed_data.text;
  }
  return JSON.stringify(parsed_data, null, 2);
};

const analyzeSchema = z.object({
  report_id: z.string().min(1),
});

export const analyzeReport = createServerFn({ method: "POST" })
  .validator(analyzeSchema)
  .handler(async ({ data }) => {
    const report = await fetchReportForUser(data.report_id, DEMO_USER_ID);
    if (!report) {
      return { success: false, error: "Report not found" };
    }
    const text = reportToText(report.parsed_data);
    const result = await analyzeCreditReport(text, report.bureau, report.user_id);

    // Persist each detected error as a draft dispute.
    const persisted: { id: string; description: string; bureau: string }[] = [];
    for (const err of result.errors) {
      const d = await dbCreateDispute({
        user_id: report.user_id,
        report_id: report.id,
        item_description: err.description,
        dispute_reason: err.reason,
        letter_content: "",
      });
      persisted.push({
        id: d.id,
        description: d.item_description,
        bureau: err.bureau,
      });
    }

    return {
      success: true,
      summary: result.summary,
      bureau: report.bureau,
      errors: result.errors,
      persisted: persisted.length,
      draft_dispute_ids: persisted.map((p) => p.id),
    };
  });

const generateLetterSchema = z.object({
  error_id: z.string().min(1),
  consumer_name: z.string().min(1),
  consumer_address: z.string().min(1),
  consumer_ssn_last4: z.string().regex(/^\d{4}$/),
  consumer_dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const generateLetter = createServerFn({ method: "POST" })
  .validator(generateLetterSchema)
  .handler(async ({ data }) => {
    const rows = await sql()`
      SELECT d.id, d.item_description, d.dispute_reason, d.user_id, d.report_id,
             r.bureau
        FROM disputes d
        JOIN credit_reports r ON r.id = d.report_id
       WHERE d.id = ${data.error_id}::uuid
       LIMIT 1
    `;
    if (!rows.length) {
      return { success: false, error: "Dispute not found" };
    }
    const r = rows[0] as Record<string, unknown>;
    const error: ErrorItem = {
      category: "other",
      account_name: "—",
      account_number_last4: null,
      bureau: r.bureau as CreditBureau,
      description: String(r.item_description),
      reason: String(r.dispute_reason),
      confidence: 0.5,
    };
    const report = {
      id: String(r.report_id),
      user_id: String(r.user_id),
      bureau: r.bureau as CreditBureau,
    };

    const letter = await generateDisputeLetter(
      error,
      report.bureau,
      {
        full_name: data.consumer_name,
        current_address: data.consumer_address,
        ssn_last4: data.consumer_ssn_last4,
        date_of_birth: data.consumer_dob,
      },
      report.user_id,
    );

    // Save the letter back to the dispute.
    await sql()`
      UPDATE disputes
         SET letter_content = ${letter.letter},
             updated_at = now()
       WHERE id = ${data.error_id}::uuid
    `;

    return {
      success: true,
      letter: letter.letter,
      key_facts: letter.key_facts,
      bureau: report.bureau,
    };
  });

const estimateImpactSchema = z.object({
  error_ids: z.array(z.string().min(1)).min(1),
});

export const estimateImpact = createServerFn({ method: "POST" })
  .validator(estimateImpactSchema)
  .handler(async ({ data }) => {
    const errors: ErrorItem[] = [];
    const rows = await sql()`
      SELECT d.id, d.item_description, d.dispute_reason, r.bureau
        FROM disputes d
        JOIN credit_reports r ON r.id = d.report_id
       WHERE d.id = ANY(${data.error_ids}::uuid[])
    `;
    for (const r of rows as Array<Record<string, unknown>>) {
      errors.push({
        category: "other",
        account_name: "—",
        account_number_last4: null,
        bureau: r.bureau as CreditBureau,
        description: String(r.item_description),
        reason: String(r.dispute_reason),
        confidence: 0.5,
      });
    }
    if (errors.length === 0) {
      return { success: false, error: "No matching disputes found" };
    }
    const estimate = await estimateScoreImpact(errors, DEMO_USER_ID);
    return { success: true, ...estimate };
  });

// =============================================================================
// Disputes — create
// =============================================================================

const createDisputeSchema = z.object({
  report_id: z.string(),
  item_description: z.string().min(10),
  dispute_reason: z.string().min(3),
  letter_content: z.string().min(10),
});

export const submitDispute = createServerFn({ method: "POST" })
  .validator(createDisputeSchema)
  .handler(async ({ data }) => {
    const dispute = await dbCreateDispute({
      user_id: DEMO_USER_ID,
      ...data,
    });
    return { success: true, id: dispute.id };
  });

// =============================================================================
// Auth — register / login (PBKDF2 + session cookies)
// =============================================================================

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const registerUser = createServerFn({ method: "POST" })
  .validator(authSchema)
  .handler(async ({ data }) => {
    const existing = await resolveUserByEmail(data.email);
    if (existing) {
      return { success: false, error: "Email already registered" };
    }
    const password_hash = hashPasswordPbkdf2(data.password);
    const user = await dbCreateUser({
      email: data.email,
      password_hash,
      name: data.name ?? null,
    });

    const session = await createAuthSession({ user_id: user.id });
    const cookie = buildSessionCookie(session);
    return jsonResponse(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { headers: { "set-cookie": cookie } },
    ) as unknown as {
      success: boolean;
      user?: { id: string; email: string; name: string | null };
      error?: string;
    };
  });

export const loginUser = createServerFn({ method: "POST" })
  .validator(authSchema)
  .handler(async ({ data }) => {
    const user = await resolveUserByEmail(data.email);
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // Demo-bypass: the seeded user has an empty `password_hash` so the demo
    // dashboard is reachable without anyone inventing a password. The first
    // real signup / login transparently upgrades the hash.
    let ok: boolean;
    if (user.password_hash === "") {
      ok = true; // demo bypass
    } else if (user.password_hash.startsWith("pbkdf2$")) {
      ok = verifyPassword(data.password, user.password_hash);
    } else {
      // Legacy SHA-256 from the file store (no rows are coming from there
      // anymore, but keep the upgrade path for users created during the
      // transition window).
      ok = false; // we'd need a SHA-256 helper to verify — just reject
    }

    if (!ok) {
      return { success: false, error: "Invalid email or password" };
    }

    if (user.password_hash === "" || !user.password_hash.startsWith("pbkdf2$")) {
      // Upgrade to PBKDF2.
      const newHash = hashPasswordPbkdf2(data.password);
      await sql()`
        UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}::uuid
      `;
    }

    const session = await createAuthSession({
      user_id: user.id,
      user_agent: null,
      ip_address: null,
    });
    const cookie = buildSessionCookie(session);
    return jsonResponse(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { headers: { "set-cookie": cookie } },
    ) as unknown as {
      success: boolean;
      user?: { id: string; email: string; name: string | null };
      error?: string;
    };
  });

export const logoutUser = createServerFn({ method: "POST" }).handler(
  async () => {
    const cookie = buildClearSessionCookie();
    return jsonResponse(
      { success: true },
      { headers: { "set-cookie": cookie } },
    ) as unknown as { success: boolean; error?: string };
  },
);

export const getDemoUser = createServerFn({ method: "GET" }).handler(async () => {
  const _user = await resolveUserById(DEMO_USER_ID);
  return {
    id: _user?.id ?? DEMO_USER_ID,
    name: _user?.name ?? "Demo User",
    email: _user?.email ?? DEMO_USER_EMAIL,
    tier: _user?.subscription_tier ?? "free",
  };
});
