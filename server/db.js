import { Database } from "bun:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data.db");

const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent reads
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    balance_cents INTEGER DEFAULT 100000,
    account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business')),
    created_at TEXT DEFAULT (datetime('now'))
  );

`);

// Add balance_cents to existing users table if missing (safe — ignores if exists)
try {
  db.run("ALTER TABLE users ADD COLUMN balance_cents INTEGER DEFAULT 100000");
} catch (_) {
  // Column already exists — that's fine
}

// Add account_type to existing users table if missing (safe — ignores if exists)
try {
  db.run("ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business'))");
} catch (_) {
  // Column already exists — that's fine
}

// Migration: allow recipient_id to be NULL for withdrawals
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );
  `);
  // Check if old transactions table has NOT NULL constraint
  const oldCount = db.query("SELECT COUNT(*) as cnt FROM transactions").get();
  if (oldCount) {
    db.exec(`
      INSERT INTO transactions_new (id, sender_id, recipient_id, amount_cents, status, created_at)
      SELECT id, sender_id, recipient_id, amount_cents, status, created_at FROM transactions;
      DROP TABLE transactions;
      ALTER TABLE transactions_new RENAME TO transactions;
    `);
  } else {
    db.exec("DROP TABLE IF EXISTS transactions");
    db.exec("ALTER TABLE transactions_new RENAME TO transactions");
  }
} catch (_) {
  // Migration already applied — that's fine
}

db.exec(`

  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_token TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('card', 'bank')),
    last_four TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS split_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    total_amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS split_payment_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_payment_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    FOREIGN KEY (split_payment_id) REFERENCES split_payments(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  );
`);

// Add Stripe-related columns to split_payment_recipients (idempotent)
try {
  db.run("ALTER TABLE split_payment_recipients ADD COLUMN payment_link_url TEXT");
} catch (_) { /* already exists */ }
try {
  db.run("ALTER TABLE split_payment_recipients ADD COLUMN stripe_session_id TEXT");
} catch (_) { /* already exists */ }
try {
  db.run("ALTER TABLE split_payment_recipients ADD COLUMN payment_status TEXT DEFAULT 'pending'");
} catch (_) { /* already exists */ }

// Add premium membership column to users (idempotent)
try {
  db.run("ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0");
} catch (_) { /* already exists */ }

// Add stripe_customer_id to users
try {
  db.run("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT");
} catch (_) { /* already exists */ }

export default db;
