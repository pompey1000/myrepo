import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Server-only database layer for ClearScore AI.
 *
 * Backed by Neon serverless Postgres (over HTTP). The connection string comes
 * from `DATABASE_URL`, which the owner connects via the database card and
 * which is injected into the sandbox and passed to the live host on publish.
 *
 * Use it only inside a `createServerFn()` handler or an `src/routes/api/*`
 * route (never client code). Two reasons:
 *   1. The connection string is a secret.
 *   2. TanStack Start's bundler tree-shakes server-only code out of the client
 *      bundle, but only if it sees no client-side import of this file.
 *
 *   const getPosts = createServerFn().handler(async () => {
 *     const rows = await sql()`select id, title, created_at from posts`;
 *     // Coerce non-primitive columns (timestamps are JS Dates) to strings
 *     // before returning to the client, or React will refuse to render them.
 *     return rows.map((r) => ({ ...r, created_at: String(r.created_at) }));
 *   });
 */

// Neon over fetch (HTTP) works in every runtime, including edge/serverless.
// This is the default, but set it explicitly so a future change to the driver
// default doesn't silently shift the wire protocol.
neonConfig.fetchConnectionCache = true;

const resolveClient = (): NeonQueryFunction<false, false> => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — connect a database (via the database card) before running queries.",
    );
  }
  return neon(url);
};

/**
 * Tagged-template query handle. The `false, false` generics pin the driver to
 * the simplest return shape (rows as objects, no full type metadata) — that's
 * what `createServerFn()` callers want when they cast the result themselves.
 *
 * Lazy: the client is created per call, not at module load, so the site still
 * builds and serves before a database is connected.
 */
export const sql = (): NeonQueryFunction<false, false> => resolveClient();

/**
 * Stable UUID for the demo user. The `scripts/seed.ts` script inserts a user
 * with this exact id, so dashboard server functions can hard-code it without
 * a DB lookup. Real users come from `registerUser` and get random UUIDs.
 */
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_USER_EMAIL = "demo@clearscore.ai";

// =============================================================================
// Domain types — match the schema in /home/team/shared/schema.sql exactly.
// Keep this list in sync with the table definitions; both are the contract.
// =============================================================================

export type SubscriptionTier = "free" | "basic" | "premium" | "one_time";
export type CreditBureau = "equifax" | "experian" | "transunion";
export type DisputeStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "won"
  | "lost"
  | "escalated";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditReport {
  id: string;
  user_id: string;
  bureau: CreditBureau;
  raw_pdf_path: string;
  parsed_data: Record<string, unknown>;
  reported_score: number | null;
  uploaded_at: string;
}

export interface Dispute {
  id: string;
  user_id: string;
  report_id: string;
  item_description: string;
  dispute_reason: string;
  letter_content: string;
  status: DisputeStatus;
  bureau_response: string | null;
  submitted_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoreHistoryRow {
  id: string;
  user_id: string;
  bureau: CreditBureau;
  score: number;
  source: string;
  recorded_at: string;
}

export interface ApiLog {
  id: string;
  user_id: string | null;
  endpoint: string;
  model: string | null;
  tokens_used: number;
  cost: number;
  meta: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// Coercion helpers — Neon returns timestamps as JS Date objects; React will
// refuse to render those (and JSON.stringify will turn them into long ISO
// strings inconsistently). Coerce to ISO strings at the boundary so the rest
// of the app can treat rows as plain JSON.
// =============================================================================

const toISO = (v: unknown): string | null => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return String(v);
};

const coerceUser = (r: Record<string, unknown>): User => ({
  ...(r as Omit<User, "created_at" | "updated_at" | "current_period_end" | "name" | "stripe_customer_id" | "stripe_subscription_id">),
  name: (r.name as string | null) ?? null,
  stripe_customer_id: (r.stripe_customer_id as string | null) ?? null,
  stripe_subscription_id: (r.stripe_subscription_id as string | null) ?? null,
  current_period_end: toISO(r.current_period_end),
  created_at: toISO(r.created_at) as string,
  updated_at: toISO(r.updated_at) as string,
});

const coerceReport = (r: Record<string, unknown>): CreditReport => ({
  ...(r as Omit<CreditReport, "uploaded_at" | "parsed_data" | "reported_score">),
  parsed_data: (r.parsed_data as Record<string, unknown>) ?? {},
  reported_score: (r.reported_score as number | null) ?? null,
  uploaded_at: toISO(r.uploaded_at) as string,
});

const coerceDispute = (r: Record<string, unknown>): Dispute => ({
  ...(r as Omit<Dispute, "submitted_at" | "resolved_at" | "bureau_response" | "created_at" | "updated_at">),
  bureau_response: (r.bureau_response as string | null) ?? null,
  submitted_at: toISO(r.submitted_at),
  resolved_at: toISO(r.resolved_at),
  created_at: toISO(r.created_at) as string,
  updated_at: toISO(r.updated_at) as string,
});

const coerceScore = (r: Record<string, unknown>): ScoreHistoryRow => ({
  ...(r as Omit<ScoreHistoryRow, "recorded_at">),
  recorded_at: toISO(r.recorded_at) as string,
});

const coerceLog = (r: Record<string, unknown>): ApiLog => ({
  ...(r as Omit<ApiLog, "user_id" | "model" | "meta" | "created_at">),
  user_id: (r.user_id as string | null) ?? null,
  model: (r.model as string | null) ?? null,
  meta: (r.meta as Record<string, unknown>) ?? {},
  created_at: toISO(r.created_at) as string,
});

// =============================================================================
// Domain helpers — the only way the rest of the codebase should touch the DB.
// Every helper returns coerced rows (ISO date strings, not Date objects) so
// callers can return them directly from `createServerFn()` handlers.
// =============================================================================

// -- users ----------------------------------------------------------------

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const rows = await sql()`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return rows.length ? coerceUser(rows[0] as Record<string, unknown>) : null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const rows = await sql()`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows.length ? coerceUser(rows[0] as Record<string, unknown>) : null;
};

export const createUser = async (input: {
  email: string;
  password_hash: string;
  name?: string | null;
}): Promise<User> => {
  const rows = await sql()`
    INSERT INTO users (email, password_hash, name)
    VALUES (${input.email}, ${input.password_hash}, ${input.name ?? null})
    RETURNING *
  `;
  return coerceUser(rows[0] as Record<string, unknown>);
};

export const updateUserSubscription = async (input: {
  user_id: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_end?: string | null;
}): Promise<User> => {
  const rows = await sql()`
    UPDATE users
       SET subscription_tier         = ${input.subscription_tier},
           stripe_customer_id       = COALESCE(${input.stripe_customer_id ?? null}, stripe_customer_id),
           stripe_subscription_id   = COALESCE(${input.stripe_subscription_id ?? null}, stripe_subscription_id),
           current_period_end       = COALESCE(${input.current_period_end ?? null}, current_period_end)
     WHERE id = ${input.user_id}
     RETURNING *
  `;
  if (!rows.length) throw new Error(`User not found: ${input.user_id}`);
  return coerceUser(rows[0] as Record<string, unknown>);
};

// -- credit_reports -------------------------------------------------------

export const listReportsForUser = async (
  user_id: string,
): Promise<CreditReport[]> => {
  const rows = await sql()`
    SELECT * FROM credit_reports
     WHERE user_id = ${user_id}
     ORDER BY uploaded_at DESC
  `;
  return rows.map((r) => coerceReport(r as Record<string, unknown>));
};

export const createReport = async (input: {
  user_id: string;
  bureau: CreditBureau;
  raw_pdf_path: string;
  parsed_data?: Record<string, unknown>;
  reported_score?: number | null;
}): Promise<CreditReport> => {
  // Cast to JSONB explicitly so the empty `{}` case round-trips correctly
  // through Neon's tagged template (which would otherwise bind the object
  // as a record and fail to serialize it).
  const rows = await sql()`
    INSERT INTO credit_reports
      (user_id, bureau, raw_pdf_path, parsed_data, reported_score)
    VALUES
      (${input.user_id},
       ${input.bureau},
       ${input.raw_pdf_path},
       ${JSON.stringify(input.parsed_data ?? {})}::jsonb,
       ${input.reported_score ?? null})
    RETURNING *
  `;
  return coerceReport(rows[0] as Record<string, unknown>);
};

// -- disputes -------------------------------------------------------------

export const listDisputesForUser = async (
  user_id: string,
): Promise<Dispute[]> => {
  const rows = await sql()`
    SELECT * FROM disputes
     WHERE user_id = ${user_id}
     ORDER BY created_at DESC
  `;
  return rows.map((r) => coerceDispute(r as Record<string, unknown>));
};

export const createDispute = async (input: {
  user_id: string;
  report_id: string;
  item_description: string;
  dispute_reason: string;
  letter_content: string;
}): Promise<Dispute> => {
  const rows = await sql()`
    INSERT INTO disputes
      (user_id, report_id, item_description, dispute_reason, letter_content)
    VALUES
      (${input.user_id}, ${input.report_id}, ${input.item_description},
       ${input.dispute_reason}, ${input.letter_content})
    RETURNING *
  `;
  return coerceDispute(rows[0] as Record<string, unknown>);
};

export const updateDisputeStatus = async (input: {
  id: string;
  user_id: string;
  status: DisputeStatus;
  bureau_response?: string | null;
}): Promise<Dispute> => {
  // Compute timestamp updates in JS and pass as bind params — easier to read
  // and reason about than splicing SQL fragments together.
  const submitted_at =
    input.status === "submitted" ? new Date().toISOString() : null;
  const resolved_at =
    input.status === "won" || input.status === "lost"
      ? new Date().toISOString()
      : null;

  const rows = await sql()`
    UPDATE disputes
       SET status          = ${input.status},
           submitted_at    = COALESCE(submitted_at, ${submitted_at}::timestamptz),
           resolved_at     = COALESCE(resolved_at,  ${resolved_at}::timestamptz),
           bureau_response = COALESCE(${input.bureau_response ?? null}, bureau_response)
     WHERE id = ${input.id} AND user_id = ${input.user_id}
     RETURNING *
  `;
  if (!rows.length) throw new Error("Dispute not found or not owned by user");
  return coerceDispute(rows[0] as Record<string, unknown>);
};

// -- score_history --------------------------------------------------------

export const recordScore = async (input: {
  user_id: string;
  bureau: CreditBureau;
  score: number;
  source?: string;
}): Promise<ScoreHistoryRow> => {
  const rows = await sql()`
    INSERT INTO score_history (user_id, bureau, score, source)
    VALUES (${input.user_id}, ${input.bureau}, ${input.score}, ${input.source ?? "user_entered"})
    RETURNING *
  `;
  return coerceScore(rows[0] as Record<string, unknown>);
};

export const listScoreHistory = async (
  user_id: string,
  bureau?: CreditBureau,
): Promise<ScoreHistoryRow[]> => {
  // Two queries to avoid a conditional template — keeps the SQL static and
  // easier for Neon to prepare/cache.
  const rows = bureau
    ? await sql()`
        SELECT * FROM score_history
         WHERE user_id = ${user_id} AND bureau = ${bureau}
         ORDER BY recorded_at ASC
      `
    : await sql()`
        SELECT * FROM score_history
         WHERE user_id = ${user_id}
         ORDER BY recorded_at ASC
      `;
  return rows.map((r) => coerceScore(r as Record<string, unknown>));
};

// -- api_logs -------------------------------------------------------------

export const logApiCall = async (input: {
  user_id?: string | null;
  endpoint: string;
  model?: string | null;
  tokens_used?: number;
  cost?: number;
  meta?: Record<string, unknown>;
}): Promise<ApiLog> => {
  const rows = await sql()`
    INSERT INTO api_logs
      (user_id, endpoint, model, tokens_used, cost, meta)
    VALUES
      (${input.user_id ?? null},
       ${input.endpoint},
       ${input.model ?? null},
       ${input.tokens_used ?? 0},
       ${input.cost ?? 0},
       ${JSON.stringify(input.meta ?? {})}::jsonb)
    RETURNING *
  `;
  return coerceLog(rows[0] as Record<string, unknown>);
};

export const sumApiCostForUser = async (
  user_id: string,
  since?: Date,
): Promise<number> => {
  const rows = since
    ? await sql()`
        SELECT COALESCE(SUM(cost), 0) AS total
          FROM api_logs
         WHERE user_id = ${user_id} AND created_at >= ${since.toISOString()}
      `
    : await sql()`
        SELECT COALESCE(SUM(cost), 0) AS total
          FROM api_logs
         WHERE user_id = ${user_id}
      `;
  const total = (rows[0] as { total: string | number }).total;
  return Number(total);
};
