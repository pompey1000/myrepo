/**
 * File-based JSON storage for ClearScore AI.
 *
 * Used as a fallback when DATABASE_URL is not set. Mirrors the interface
 * of ~/db.ts so server functions can swap between file and DB storage
 * transparently via a config flag.
 *
 * Each collection is a single JSON file in /home/team/shared/site/data/
 * with a rows array. This is NOT suitable for production scale but allows
 * the frontend to be fully wired before the Neon DB is connected.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

import type {
  CreditBureau,
  DisputeStatus,
  User,
  CreditReport,
  Dispute,
  ScoreHistoryRow,
} from "~/db";

// =============================================================================
// Config
// =============================================================================

const DATA_DIR = path.resolve(process.cwd(), "data");

const ensureDir = async () => {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
};

// =============================================================================
// Generic CRUD helpers
// =============================================================================

type Identifiable = { id: string };

const readCollection = async <T extends Identifiable>(
  name: string,
): Promise<T[]> => {
  await ensureDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!existsSync(filePath)) return [];
  const raw = await readFile(filePath, "utf-8").catch(() => "[]");
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
};

const writeCollection = async <T extends Identifiable>(
  name: string,
  rows: T[],
): Promise<void> => {
  await ensureDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);
  await writeFile(filePath, JSON.stringify(rows, null, 2), "utf-8");
};

// =============================================================================
// Seed data — pre-populate when a collection is empty
// =============================================================================

const SEED_USER_ID = "u-seed-001";

const getSeedUser = (): User[] => [
  {
    id: SEED_USER_ID,
    email: "demo@clearscore.ai",
    password_hash: "", // not used in demo mode
    name: "John Doe",
    subscription_tier: "free",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const getSeedReports = (): CreditReport[] => [
  {
    id: "rpt-001",
    user_id: SEED_USER_ID,
    bureau: "equifax",
    raw_pdf_path: "/uploads/equifax-report.pdf",
    parsed_data: {
      accounts: [
        { name: "Capital One", balance: 1200, status: "current" },
        { name: "Chase", balance: 4500, status: "late_30" },
      ],
    },
    reported_score: 642,
    uploaded_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "rpt-002",
    user_id: SEED_USER_ID,
    bureau: "experian",
    raw_pdf_path: "/uploads/experian-report.pdf",
    parsed_data: {
      accounts: [
        { name: "Capital One", balance: 1200, status: "current" },
        { name: "Amex", balance: 0, status: "closed" },
      ],
    },
    reported_score: 655,
    uploaded_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "rpt-003",
    user_id: SEED_USER_ID,
    bureau: "transunion",
    raw_pdf_path: "",
    parsed_data: {},
    reported_score: null,
    uploaded_at: new Date().toISOString(),
  },
];

const getSeedScoreHistory = (): ScoreHistoryRow[] => {
  const days = [30, 25, 18, 10, 5, 2];
  const scores = [612, 618, 625, 631, 640, 648];
  return days.map((d, i) => ({
    id: `sh-${String(i + 1).padStart(3, "0")}`,
    user_id: SEED_USER_ID,
    bureau: "equifax" as CreditBureau,
    score: scores[i]!,
    source: "user_entered",
    recorded_at: new Date(Date.now() - d * 86400000).toISOString(),
  }));
};

const getSeedDisputes = (): Dispute[] => [
  {
    id: "dsp-001",
    user_id: SEED_USER_ID,
    report_id: "rpt-001",
    item_description: "Late payment (Jan 2024) — account was paid on time",
    dispute_reason: "incorrect_status",
    letter_content: "To Whom It May Concern...",
    status: "submitted",
    bureau_response: null,
    submitted_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "dsp-002",
    user_id: SEED_USER_ID,
    report_id: "rpt-001",
    item_description: "Incorrect balance — reported $4,200, actual $1,800",
    dispute_reason: "incorrect_balance",
    letter_content: "To Whom It May Concern...",
    status: "submitted",
    bureau_response: null,
    submitted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "dsp-003",
    user_id: SEED_USER_ID,
    report_id: "rpt-002",
    item_description: "Account not mine — possible identity error",
    dispute_reason: "identity_error",
    letter_content: "To Whom It May Concern...",
    status: "draft",
    bureau_response: null,
    submitted_at: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "dsp-004",
    user_id: SEED_USER_ID,
    report_id: "rpt-001",
    item_description: "Charge-off amount incorrect ($3,500 vs $1,200)",
    dispute_reason: "incorrect_balance",
    letter_content: "To Whom It May Concern...",
    status: "won",
    bureau_response: "Item removed from report.",
    submitted_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: "dsp-005",
    user_id: SEED_USER_ID,
    report_id: "rpt-002",
    item_description: "Duplicate collection account",
    dispute_reason: "duplicate_account",
    letter_content: "To Whom It May Concern...",
    status: "won",
    bureau_response: "Duplicate removed.",
    submitted_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

const SEEDERS: Record<string, () => Identifiable[]> = {
  users: getSeedUser,
  credit_reports: getSeedReports,
  disputes: getSeedDisputes,
  score_history: getSeedScoreHistory,
};

// =============================================================================
// Public collection functions
// =============================================================================

const seedIfEmpty = async (collection: string): Promise<boolean> => {
  const seeder = SEEDERS[collection];
  if (!seeder) return false;
  const rows = await readCollection(collection);
  if (rows.length > 0) return false;
  await writeCollection(collection, seeder());
  return true;
};

// -- users ------------------------------------------------------------------

export const storeFindUserByEmail = async (
  email: string,
): Promise<User | null> => {
  await seedIfEmpty("users");
  const users = await readCollection<User>("users");
  return users.find((u) => u.email === email) ?? null;
};

export const storeFindUserById = async (
  id: string,
): Promise<User | null> => {
  await seedIfEmpty("users");
  const users = await readCollection<User>("users");
  return users.find((u) => u.id === id) ?? null;
};

export const storeCreateUser = async (input: {
  email: string;
  password_hash: string;
  name?: string | null;
}): Promise<User> => {
  const users = await readCollection<User>("users");
  const user: User = {
    id: `u-${randomUUID().slice(0, 8)}`,
    email: input.email,
    password_hash: input.password_hash,
    name: input.name ?? null,
    subscription_tier: "free",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(user);
  await writeCollection("users", users);
  return user;
};

// -- credit_reports ---------------------------------------------------------

export const storeListReportsForUser = async (
  user_id: string,
): Promise<CreditReport[]> => {
  await seedIfEmpty("credit_reports");
  const reports = await readCollection<CreditReport>("credit_reports");
  return reports.filter((r) => r.user_id === user_id);
};

export const storeCreateReport = async (input: {
  user_id: string;
  bureau: CreditBureau;
  raw_pdf_path: string;
  parsed_data?: Record<string, unknown>;
  reported_score?: number | null;
}): Promise<CreditReport> => {
  const reports = await readCollection<CreditReport>("credit_reports");
  const report: CreditReport = {
    id: `rpt-${randomUUID().slice(0, 8)}`,
    user_id: input.user_id,
    bureau: input.bureau,
    raw_pdf_path: input.raw_pdf_path,
    parsed_data: input.parsed_data ?? {},
    reported_score: input.reported_score ?? null,
    uploaded_at: new Date().toISOString(),
  };
  reports.push(report);
  await writeCollection("credit_reports", reports);
  return report;
};

// -- disputes ---------------------------------------------------------------

export const storeListDisputesForUser = async (
  user_id: string,
): Promise<Dispute[]> => {
  await seedIfEmpty("disputes");
  const disputes = await readCollection<Dispute>("disputes");
  return disputes.filter((d) => d.user_id === user_id);
};

export const storeCreateDispute = async (input: {
  user_id: string;
  report_id: string;
  item_description: string;
  dispute_reason: string;
  letter_content: string;
}): Promise<Dispute> => {
  const disputes = await readCollection<Dispute>("disputes");
  const dispute: Dispute = {
    id: `dsp-${randomUUID().slice(0, 8)}`,
    user_id: input.user_id,
    report_id: input.report_id,
    item_description: input.item_description,
    dispute_reason: input.dispute_reason,
    letter_content: input.letter_content,
    status: "draft",
    bureau_response: null,
    submitted_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  disputes.push(dispute);
  await writeCollection("disputes", disputes);
  return dispute;
};

export const storeUpdateDisputeStatus = async (input: {
  id: string;
  user_id: string;
  status: DisputeStatus;
  bureau_response?: string | null;
}): Promise<Dispute> => {
  const disputes = await readCollection<Dispute>("disputes");
  const idx = disputes.findIndex(
    (d) => d.id === input.id && d.user_id === input.user_id,
  );
  if (idx === -1) throw new Error("Dispute not found or not owned by user");
  const now = new Date().toISOString();
  disputes[idx] = {
    ...disputes[idx],
    status: input.status,
    submitted_at:
      input.status === "submitted" && !disputes[idx].submitted_at
        ? now
        : disputes[idx].submitted_at,
    resolved_at:
      (input.status === "won" || input.status === "lost") &&
      !disputes[idx].resolved_at
        ? now
        : disputes[idx].resolved_at,
    bureau_response: input.bureau_response ?? disputes[idx].bureau_response,
    updated_at: now,
  };
  await writeCollection("disputes", disputes);
  return disputes[idx]!;
};

// -- score_history ----------------------------------------------------------

export const storeListScoreHistory = async (
  user_id: string,
): Promise<ScoreHistoryRow[]> => {
  await seedIfEmpty("score_history");
  const scores = await readCollection<ScoreHistoryRow>("score_history");
  return scores.filter((s) => s.user_id === user_id);
};

export const storeRecordScore = async (input: {
  user_id: string;
  bureau: CreditBureau;
  score: number;
  source?: string;
}): Promise<ScoreHistoryRow> => {
  const scores = await readCollection<ScoreHistoryRow>("score_history");
  const entry: ScoreHistoryRow = {
    id: `sh-${randomUUID().slice(0, 8)}`,
    user_id: input.user_id,
    bureau: input.bureau,
    score: input.score,
    source: input.source ?? "user_entered",
    recorded_at: new Date().toISOString(),
  };
  scores.push(entry);
  await writeCollection("score_history", scores);
  return entry;
};
