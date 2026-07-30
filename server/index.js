import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import db from "./db.js";
import { signToken, authMiddleware } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

const STRIPE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";

app.use(express.json());

// ── Auth routes ───────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password, accountType } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Validate accountType if provided
    const resolvedAccountType = accountType || "personal";
    if (!["personal", "business"].includes(resolvedAccountType)) {
      return res.status(400).json({ error: "accountType must be 'personal' or 'business'" });
    }

    // Check if email already exists
    const existing = db.query("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db.run(
      "INSERT INTO users (email, username, password_hash, account_type) VALUES (?, ?, ?, ?)",
      [email, username, passwordHash, resolvedAccountType]
    );

    const user = db
      .query("SELECT id, email, username, account_type, membership, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountType: user.account_type || "personal",
        membership: user.membership || "free",
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db
      .query("SELECT id, email, username, password_hash, account_type, membership, created_at FROM users WHERE email = ?")
      .get(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountType: user.account_type || "personal",
        membership: user.membership || "free",
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me — protected
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const { account_type, membership, ...rest } = req.user;
  res.json({ user: { ...rest, accountType: account_type || "personal", membership: membership || "free" } });
});

// ── Payment method routes ──────────────────────────────────────────────────────

// POST /api/payment-methods — Add a new payment method
app.post("/api/payment-methods", authMiddleware, (req, res) => {
  try {
    const { stripeToken, type, lastFour } = req.body;

    if (!stripeToken || !type || !lastFour) {
      return res.status(400).json({ error: "stripeToken, type, and lastFour are required" });
    }

    if (type !== "card" && type !== "bank") {
      return res.status(400).json({ error: "type must be 'card' or 'bank'" });
    }

    if (!/^\d{4}$/.test(lastFour)) {
      return res.status(400).json({ error: "lastFour must be exactly 4 digits" });
    }

    const result = db.run(
      "INSERT INTO payment_methods (user_id, stripe_token, type, last_four) VALUES (?, ?, ?, ?)",
      [req.user.id, stripeToken, type, lastFour]
    );

    const method = db
      .query("SELECT id, user_id, type, last_four, created_at FROM payment_methods WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({ paymentMethod: method });
  } catch (err) {
    console.error("Add payment method error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payment-methods — List user's payment methods
app.get("/api/payment-methods", authMiddleware, (req, res) => {
  try {
    const methods = db
      .query(
        "SELECT id, user_id, type, last_four, created_at FROM payment_methods WHERE user_id = ? ORDER BY created_at DESC"
      )
      .all(req.user.id);

    res.json({ paymentMethods: methods });
  } catch (err) {
    console.error("List payment methods error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/payment-methods/:id — Remove a payment method
app.delete("/api/payment-methods/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const method = db
      .query("SELECT id FROM payment_methods WHERE id = ? AND user_id = ?")
      .get(id, req.user.id);

    if (!method) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    db.run("DELETE FROM payment_methods WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete payment method error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── User routes ────────────────────────────────────────────────────────────────

// GET /api/users/search?q=... — Search users by email or username
app.get("/api/users/search", authMiddleware, (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    const users = db
      .query(
        `SELECT id, email, username FROM users
         WHERE id != ? AND (email LIKE ? OR username LIKE ?)
         LIMIT 10`
      )
      .all(req.user.id, searchTerm, searchTerm);

    res.json({ users });
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/me/balance — Get current user's balance
app.get("/api/users/me/balance", authMiddleware, (req, res) => {
  try {
    const user = db
      .query("SELECT balance_cents FROM users WHERE id = ?")
      .get(req.user.id);

    res.json({ balanceCents: user ? user.balance_cents : 0 });
  } catch (err) {
    console.error("Balance fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Withdrawal routes ────────────────────────────────────────────────────────────

// POST /api/withdraw — Withdraw balance to a linked payment method
app.post("/api/withdraw", authMiddleware, (req, res) => {
  try {
    const { amountCents, paymentMethodId } = req.body;

    // Validation
    if (!amountCents || typeof amountCents !== "number" || amountCents <= 0 || !Number.isInteger(amountCents)) {
      return res.status(400).json({ error: "amountCents must be a positive integer" });
    }

    if (!paymentMethodId || typeof paymentMethodId !== "number") {
      return res.status(400).json({ error: "A valid paymentMethodId is required" });
    }

    // Verify payment method belongs to user
    const paymentMethod = db
      .query("SELECT id, type, last_four FROM payment_methods WHERE id = ? AND user_id = ?")
      .get(paymentMethodId, req.user.id);

    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method not found or does not belong to you" });
    }

    if (paymentMethod.type !== "card" && paymentMethod.type !== "bank") {
      return res.status(400).json({ error: "Payment method must be 'card' or 'bank'" });
    }

    // Check user balance
    const user = db
      .query("SELECT balance_cents FROM users WHERE id = ?")
      .get(req.user.id);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.balance_cents < amountCents) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Fee calculation based on account type AND membership
    const membership = req.user.membership || "free";
    const accountType = req.user.account_type || "personal";
    
    let feePercent = 0;
    let feeCents = 0;

    if (membership === "premium") {
      // Premium members pay no fees on any withdrawal method
      feePercent = 0;
      feeCents = 0;
    } else if (paymentMethod.type === "card") {
      if (accountType === "business") {
        feePercent = 5;
        feeCents = Math.ceil(amountCents * 5 / 100);
      } else {
        feePercent = 3.5;
        feeCents = Math.ceil(amountCents * 35 / 1000);
      }
    }
    // Bank withdrawals are always free for non-premium too
    const netCents = amountCents - feeCents;

    // Atomic transaction
    db.run("BEGIN TRANSACTION");

    try {
      // Deduct from user's balance
      db.run("UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?", [
        amountCents,
        req.user.id,
      ]);

      // Create withdrawal transaction record (recipient_id = NULL)
      db.run(
        "INSERT INTO transactions (sender_id, recipient_id, amount_cents, status) VALUES (?, NULL, ?, 'completed')",
        [req.user.id, amountCents]
      );

      db.run("COMMIT");

      // Get updated balance
      const updatedUser = db
        .query("SELECT balance_cents FROM users WHERE id = ?")
        .get(req.user.id);

      res.status(201).json({
        success: true,
        amountCents,
        feeCents,
        feePercent,
        netCents,
        membership,
        newBalanceCents: updatedUser.balance_cents,
        paymentMethod: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          lastFour: paymentMethod.last_four,
        },
      });
    } catch (innerErr) {
      db.run("ROLLBACK");
      throw innerErr;
    }
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Membership routes ───────────────────────────────────────────────────────────

// GET /api/membership — Get current membership status
app.get("/api/membership", authMiddleware, (req, res) => {
  try {
    const membership = req.user.membership || "free";
    res.json({ membership });
  } catch (err) {
    console.error("Membership fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/membership/upgrade — Simulated upgrade to premium
app.post("/api/membership/upgrade", authMiddleware, (req, res) => {
  try {
    const currentMembership = req.user.membership || "free";
    
    if (currentMembership === "premium") {
      return res.json({ membership: "premium", message: "You are already a Premium member!" });
    }

    // Flip the flag — no real payment processing yet
    db.run("UPDATE users SET membership = 'premium' WHERE id = ?", [req.user.id]);

    res.json({ membership: "premium", message: "Welcome to Premium! 🎉" });
  } catch (err) {
    console.error("Membership upgrade error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Transaction history routes ─────────────────────────────────────────────────

// GET /api/transactions — Get all transactions for the current user
app.get("/api/transactions", authMiddleware, (req, res) => {
  try {
    const transactions = db
      .query(
        `SELECT
           t.id,
           t.sender_id,
           t.recipient_id,
           t.amount_cents,
           t.status,
           t.created_at,
           u_rec.email AS other_email,
           u_rec.username AS other_username,
           u_rec.id AS other_id
         FROM transactions t
         JOIN users u_send ON u_send.id = t.sender_id
         LEFT JOIN users u_rec ON u_rec.id = t.recipient_id
         WHERE t.sender_id = ? OR t.recipient_id = ?
         ORDER BY t.created_at DESC`
      )
      .all(req.user.id, req.user.id);

    const formatted = transactions.map((t) => {
      const isWithdrawal = t.recipient_id === null;
      return {
        id: t.id,
        sender_id: t.sender_id,
        recipient_id: t.recipient_id,
        amount_cents: t.amount_cents,
        status: t.status,
        created_at: t.created_at,
        direction: isWithdrawal ? "withdrawal" : (t.sender_id === req.user.id ? "sent" : "received"),
        other_user: isWithdrawal ? null : {
          id: t.other_id,
          email: t.other_email,
          username: t.other_username,
        },
      };
    });

    res.json({ transactions: formatted });
  } catch (err) {
    console.error("Transaction history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Split payment routes ─────────────────────────────────────────────────────

// POST /api/payments/split — Create a split payment
app.post("/api/payments/split", authMiddleware, (req, res) => {
  try {
    const { recipients, paymentMethodId } = req.body;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "At least one recipient is required" });
    }

    for (const r of recipients) {
      if (!r.email || !r.amountCents) {
        return res.status(400).json({ error: "Each recipient must have email and amountCents" });
      }
      if (typeof r.amountCents !== "number" || r.amountCents <= 0 || !Number.isInteger(r.amountCents)) {
        return res.status(400).json({ error: "Each amountCents must be a positive integer" });
      }
    }

    if (!paymentMethodId || typeof paymentMethodId !== "number") {
      return res.status(400).json({ error: "A valid paymentMethodId is required" });
    }

    // Verify payment method belongs to sender
    const paymentMethod = db
      .query("SELECT id FROM payment_methods WHERE id = ? AND user_id = ?")
      .get(paymentMethodId, req.user.id);

    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method not found or does not belong to you" });
    }

    // Resolve recipients and validate
    const resolvedRecipients = [];
    const seenIds = new Set();

    for (const r of recipients) {
      const user = db
        .query("SELECT id, email, username FROM users WHERE email = ?")
        .get(r.email);

      if (!user) {
        return res.status(400).json({ error: `User not found: ${r.email}` });
      }

      if (user.id === req.user.id) {
        return res.status(400).json({ error: "You cannot send money to yourself" });
      }

      if (seenIds.has(user.id)) {
        return res.status(400).json({ error: `Duplicate recipient: ${r.email}` });
      }
      seenIds.add(user.id);

      resolvedRecipients.push({
        userId: user.id,
        email: user.email,
        username: user.username,
        amountCents: r.amountCents,
      });
    }

    // Calculate total
    const totalAmountCents = resolvedRecipients.reduce((sum, r) => sum + r.amountCents, 0);

    // Begin transaction
    db.run("BEGIN TRANSACTION");

    try {
      // Check sender balance (lock the row)
      const sender = db
        .query("SELECT balance_cents FROM users WHERE id = ?")
        .get(req.user.id);

      if (!sender || sender.balance_cents < totalAmountCents) {
        db.run("ROLLBACK");
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct from sender
      db.run("UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?", [
        totalAmountCents,
        req.user.id,
      ]);

      // Create split_payments record
      const splitResult = db.run(
        "INSERT INTO split_payments (sender_id, total_amount_cents, status) VALUES (?, ?, 'completed')",
        [req.user.id, totalAmountCents]
      );
      const splitPaymentId = splitResult.lastInsertRowid;

      // Create split_payment_recipients and transactions for each recipient
      for (const r of resolvedRecipients) {
        // Add to recipient's balance
        db.run("UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?", [
          r.amountCents,
          r.userId,
        ]);

        // Create split_payment_recipients record
        db.run(
          "INSERT INTO split_payment_recipients (split_payment_id, recipient_id, amount_cents) VALUES (?, ?, ?)",
          [splitPaymentId, r.userId, r.amountCents]
        );

        // Create individual transaction record
        db.run(
          "INSERT INTO transactions (sender_id, recipient_id, amount_cents, status) VALUES (?, ?, ?, 'completed')",
          [req.user.id, r.userId, r.amountCents]
        );
      }

      db.run("COMMIT");

      // Fetch the created split payment with recipients
      const splitPayment = db
        .query(
          `SELECT id, sender_id, total_amount_cents, status, created_at
           FROM split_payments WHERE id = ?`
        )
        .get(splitPaymentId);

      const recipientRows = db
        .query(
          `SELECT spr.id, spr.recipient_id, spr.amount_cents, u.email, u.username
           FROM split_payment_recipients spr
           JOIN users u ON u.id = spr.recipient_id
           WHERE spr.split_payment_id = ?`
        )
        .all(splitPaymentId);

      const newBalance = db
        .query("SELECT balance_cents FROM users WHERE id = ?")
        .get(req.user.id);

      res.status(201).json({
        payment: {
          ...splitPayment,
          recipients: recipientRows,
        },
        newBalanceCents: newBalance.balance_cents,
      });
    } catch (innerErr) {
      db.run("ROLLBACK");
      throw innerErr;
    }
  } catch (err) {
    console.error("Split payment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payments/split — List sender's split payments
app.get("/api/payments/split", authMiddleware, (req, res) => {
  try {
    const payments = db
      .query(
        `SELECT id, sender_id, total_amount_cents, status, created_at
         FROM split_payments
         WHERE sender_id = ?
         ORDER BY created_at DESC`
      )
      .all(req.user.id);

    // For each payment, fetch recipients
    const paymentsWithRecipients = payments.map((p) => {
      const recipients = db
        .query(
          `SELECT spr.id, spr.recipient_id, spr.amount_cents, u.email, u.username
           FROM split_payment_recipients spr
           JOIN users u ON u.id = spr.recipient_id
           WHERE spr.split_payment_id = ?`
        )
        .all(p.id);
      return { ...p, recipients };
    });

    res.json({ payments: paymentsWithRecipients });
  } catch (err) {
    console.error("List split payments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Serve static frontend in production ───────────────────────────────────────
const clientDist = path.join(__dirname, "..", "client", "dist");

// Serve index.html with Stripe key injected
app.get("/", (_req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  let html = fs.readFileSync(indexPath, "utf-8");
  html = html.replace("__STRIPE_KEY__", STRIPE_KEY);
  res.set("Content-Type", "text/html");
  res.send(html);
});

app.use(express.static(clientDist));

// SPA fallback: serve index.html for any non-API, non-static route
app.get("*", (_req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  let html = fs.readFileSync(indexPath, "utf-8");
  html = html.replace("__STRIPE_KEY__", STRIPE_KEY);
  res.set("Content-Type", "text/html");
  res.send(html);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`QuickSplit server listening on http://0.0.0.0:${PORT}`);
});
