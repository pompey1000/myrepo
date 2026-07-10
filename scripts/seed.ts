/**
 * ClearScore AI — Demo seed script.
 *
 * Inserts the same demo data that the file store used to serve, but into
 * Neon Postgres. Idempotent: re-running on a populated database is a no-op
 * (exits with a "already seeded" message). To re-seed from scratch, run
 * the cleanup block at the bottom of the file or DROP the rows manually.
 *
 * Run with:  DATABASE_URL=... bun run scripts/seed.ts
 *
 * The demo user gets a fixed UUID so the dashboard code can reference it
 * without a lookup. The `DEMO_USER_ID` constant in ~/db.ts is the same
 * value, so dashboard server functions don't need to query for it.
 */

import { neon } from "@neondatabase/serverless";

// Fixed UUID for the demo user so the dashboard's DEMO_USER_ID constant
// in ~/db.ts lines up. Stable across seeds.
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_USER_EMAIL = "demo@clearscore.ai";

const DAY = 86_400_000;
const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

const bail = (msg: string): never => {
  console.error(`\n[seed] ${msg}\n`);
  process.exit(1);
};

const url = process.env.DATABASE_URL;
if (!url) bail("DATABASE_URL is not set — export it before running this script.");
// `url` is checked above; the non-null assertion tells TS the same.
const sql = neon(url as string);

const main = async (): Promise<void> => {
  // ---------------------------------------------------------------------------
  // 0. Bail if the demo user is already there.
  // ---------------------------------------------------------------------------
  const existing = await sql`
    SELECT id FROM users WHERE id = ${DEMO_USER_ID}::uuid LIMIT 1
  `;
  if (existing.length > 0) {
    console.log(`[seed] Demo user ${DEMO_USER_ID} already exists — nothing to do.`);
    console.log(`[seed] To re-seed, run:  DELETE FROM users WHERE id = '${DEMO_USER_ID}';`);
    process.exit(0);
  }

  // ---------------------------------------------------------------------------
  // 1. Demo user
  // ---------------------------------------------------------------------------
  console.log("[seed] Inserting demo user…");
  await sql`
    INSERT INTO users (
      id, email, password_hash, name, subscription_tier,
      stripe_customer_id, stripe_subscription_id, current_period_end
    ) VALUES (
      ${DEMO_USER_ID}::uuid,
      ${DEMO_USER_EMAIL},
      ${""},  -- demo mode — login uses a code path that doesn't check this
      ${"John Doe"},
      ${"free"}::subscription_tier,
      ${null},
      ${null},
      ${null}
    )
  `;

  // ---------------------------------------------------------------------------
  // 2. Three credit reports (one per bureau; the third is "pending")
  // ---------------------------------------------------------------------------
  console.log("[seed] Inserting 3 credit reports…");
  const [rpt1] = await sql`
    INSERT INTO credit_reports (user_id, bureau, raw_pdf_path, parsed_data, reported_score, uploaded_at)
    VALUES (
      ${DEMO_USER_ID}::uuid,
      ${"equifax"}::credit_bureau,
      ${"/uploads/equifax-report.pdf"},
      ${{
        accounts: [
          { name: "Capital One", balance: 1200, status: "current" },
          { name: "Chase", balance: 4500, status: "late_30" },
        ],
      }}::jsonb,
      ${642},
      ${daysAgo(3)}::timestamptz
    )
    RETURNING id
  `;
  const [rpt2] = await sql`
    INSERT INTO credit_reports (user_id, bureau, raw_pdf_path, parsed_data, reported_score, uploaded_at)
    VALUES (
      ${DEMO_USER_ID}::uuid,
      ${"experian"}::credit_bureau,
      ${"/uploads/experian-report.pdf"},
      ${{
        accounts: [
          { name: "Capital One", balance: 1200, status: "current" },
          { name: "Amex", balance: 0, status: "closed" },
        ],
      }}::jsonb,
      ${655},
      ${daysAgo(3)}::timestamptz
    )
    RETURNING id
  `;
  const [rpt3] = await sql`
    INSERT INTO credit_reports (user_id, bureau, raw_pdf_path, parsed_data, reported_score, uploaded_at)
    VALUES (
      ${DEMO_USER_ID}::uuid,
      ${"transunion"}::credit_bureau,
      ${""},
      ${{}}::jsonb,
      ${null},
      ${now()}::timestamptz
    )
    RETURNING id
  `;
  const rptEquifax = rpt1!.id as string;
  const rptExperian = rpt2!.id as string;
  const _rptTransunion = rpt3!.id as string;
  void _rptTransunion; // not used below — TransUnion has no disputes in the seed

  // ---------------------------------------------------------------------------
  // 3. Five disputes — 2 active, 1 draft, 2 won
  // ---------------------------------------------------------------------------
  console.log("[seed] Inserting 5 disputes…");
  await sql`
    INSERT INTO disputes (
      user_id, report_id, item_description, dispute_reason, letter_content,
      status, bureau_response, submitted_at, resolved_at, created_at
    ) VALUES (
      ${DEMO_USER_ID}::uuid, ${rptEquifax}::uuid,
      ${"Late payment (Jan 2024) — account was paid on time"},
      ${"incorrect_status"},
      ${"To Whom It May Concern..."},
      ${"submitted"}::dispute_status, ${null},
      ${daysAgo(5)}::timestamptz, ${null},
      ${daysAgo(5)}::timestamptz
    )
  `;
  await sql`
    INSERT INTO disputes (
      user_id, report_id, item_description, dispute_reason, letter_content,
      status, bureau_response, submitted_at, resolved_at, created_at
    ) VALUES (
      ${DEMO_USER_ID}::uuid, ${rptEquifax}::uuid,
      ${"Incorrect balance — reported $4,200, actual $1,800"},
      ${"incorrect_balance"},
      ${"To Whom It May Concern..."},
      ${"submitted"}::dispute_status, ${null},
      ${daysAgo(4)}::timestamptz, ${null},
      ${daysAgo(4)}::timestamptz
    )
  `;
  await sql`
    INSERT INTO disputes (
      user_id, report_id, item_description, dispute_reason, letter_content,
      status, bureau_response, submitted_at, resolved_at, created_at
    ) VALUES (
      ${DEMO_USER_ID}::uuid, ${rptExperian}::uuid,
      ${"Account not mine — possible identity error"},
      ${"identity_error"},
      ${"To Whom It May Concern..."},
      ${"draft"}::dispute_status, ${null},
      ${null}, ${null},
      ${daysAgo(1)}::timestamptz
    )
  `;
  await sql`
    INSERT INTO disputes (
      user_id, report_id, item_description, dispute_reason, letter_content,
      status, bureau_response, submitted_at, resolved_at, created_at
    ) VALUES (
      ${DEMO_USER_ID}::uuid, ${rptEquifax}::uuid,
      ${"Charge-off amount incorrect ($3,500 vs $1,200)"},
      ${"incorrect_balance"},
      ${"To Whom It May Concern..."},
      ${"won"}::dispute_status, ${"Item removed from report."},
      ${daysAgo(20)}::timestamptz, ${daysAgo(8)}::timestamptz,
      ${daysAgo(20)}::timestamptz
    )
  `;
  await sql`
    INSERT INTO disputes (
      user_id, report_id, item_description, dispute_reason, letter_content,
      status, bureau_response, submitted_at, resolved_at, created_at
    ) VALUES (
      ${DEMO_USER_ID}::uuid, ${rptExperian}::uuid,
      ${"Duplicate collection account"},
      ${"duplicate_account"},
      ${"To Whom It May Concern..."},
      ${"won"}::dispute_status, ${"Duplicate removed."},
      ${daysAgo(25)}::timestamptz, ${daysAgo(12)}::timestamptz,
      ${daysAgo(25)}::timestamptz
    )
  `;

  // ---------------------------------------------------------------------------
  // 4. Six score-history rows (one score per "checkpoint" the dashboard charts)
  // ---------------------------------------------------------------------------
  console.log("[seed] Inserting 6 score history rows…");
  const points = [
    { days: 30, score: 612 },
    { days: 25, score: 618 },
    { days: 18, score: 625 },
    { days: 10, score: 631 },
    { days: 5, score: 640 },
    { days: 2, score: 648 },
  ];
  for (const p of points) {
    await sql`
      INSERT INTO score_history (user_id, bureau, score, source, recorded_at)
      VALUES (
        ${DEMO_USER_ID}::uuid,
        ${"equifax"}::credit_bureau,
        ${p.score},
        ${"user_entered"},
        ${daysAgo(p.days)}::timestamptz
      )
    `;
  }

  console.log("\n[seed] Done. Summary:");
  console.log(`  - demo user:     ${DEMO_USER_ID} (${DEMO_USER_EMAIL})`);
  console.log(`  - 3 reports      (Equifax, Experian, TransUnion)`);
  console.log(`  - 5 disputes     (2 active, 1 draft, 2 won)`);
  console.log(`  - 6 score points (Equifax, 30 days back → 2 days back)`);
  console.log(`\n[seed] Open /dashboard to see the demo data.`);
};

main().catch((err) => {
  console.error("\n[seed] Failed:", err);
  process.exit(1);
});
