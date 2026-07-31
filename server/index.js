import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import db from "./db.js";
import { signToken, authMiddleware } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

const STRIPE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

let stripe = null;
if (STRIPE_SECRET) {
  stripe = new Stripe(STRIPE_SECRET);
}

// ── Raw body middleware for Stripe webhook (must come before express.json) ──
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

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
      .query("SELECT id, email, username, account_type, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountType: user.account_type || "personal",
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
      .query("SELECT id, email, username, password_hash, account_type, created_at FROM users WHERE email = ?")
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
  const { account_type, ...rest } = req.user;
  res.json({ user: { ...rest, accountType: account_type || "personal" } });
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

    // Check user balance and account details
    const user = db
      .query("SELECT balance_cents, account_type, is_premium FROM users WHERE id = ?")
      .get(req.user.id);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.balance_cents < amountCents) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Fee calculation
    let feeCents = 0;
    if (paymentMethod.type === "card") {
      if (!user.is_premium) {
        if (user.account_type === "business") {
          feeCents = Math.ceil(amountCents * 0.05);   // 5% for business accounts
        } else {
          feeCents = Math.ceil(amountCents * 0.035);  // 3.5% for personal accounts
        }
      }
      // Premium users: no fee
    }
    // Bank: always free
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
        netCents,
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

// Helper: Simulate split (fallback when no Stripe key)
function simulateSplitPayment(req, res, resolvedRecipients, totalAmountCents) {
  db.run("BEGIN TRANSACTION");
  try {
    const splitResult = db.run(
      "INSERT INTO split_payments (sender_id, total_amount_cents, status) VALUES (?, ?, 'completed')",
      [req.user.id, totalAmountCents]
    );
    const splitPaymentId = splitResult.lastInsertRowid;

    for (const r of resolvedRecipients) {
      db.run("UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?", [
        r.amountCents,
        r.userId,
      ]);
      db.run(
        "INSERT INTO split_payment_recipients (split_payment_id, recipient_id, amount_cents, payment_status) VALUES (?, ?, ?, 'paid')",
        [splitPaymentId, r.userId, r.amountCents]
      );
    }

    db.run("COMMIT");

    const splitPayment = db
      .query("SELECT id, sender_id, total_amount_cents, status, created_at FROM split_payments WHERE id = ?")
      .get(splitPaymentId);

    const recipientRows = db
      .query(
        `SELECT spr.id, spr.recipient_id, spr.amount_cents, spr.payment_link_url, spr.payment_status,
                u.email, u.username
         FROM split_payment_recipients spr
         JOIN users u ON u.id = spr.recipient_id
         WHERE spr.split_payment_id = ?`
      )
      .all(splitPaymentId);

    res.status(201).json({
      payment: { ...splitPayment, recipients: recipientRows },
      mode: "simulated",
    });
  } catch (innerErr) {
    db.run("ROLLBACK");
    throw innerErr;
  }
}

// POST /api/payments/split — Create a split payment with real Stripe Payment Links
app.post("/api/payments/split", authMiddleware, async (req, res) => {
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
        return res.status(400).json({ error: "You cannot request money from yourself" });
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

    const totalAmountCents = resolvedRecipients.reduce((sum, r) => sum + r.amountCents, 0);

    // If no Stripe key, fall back to simulated flow
    if (!stripe) {
      return simulateSplitPayment(req, res, resolvedRecipients, totalAmountCents);
    }

    // Try real Stripe Payment Links — fall back to simulated on any Stripe error
    try {
      db.run("BEGIN TRANSACTION");
      const splitResult = db.run(
        "INSERT INTO split_payments (sender_id, total_amount_cents, status) VALUES (?, ?, 'pending')",
        [req.user.id, totalAmountCents]
      );
      const splitPaymentId = splitResult.lastInsertRowid;

      const recipientRows = [];

      for (const r of resolvedRecipients) {
        // Create Stripe Payment Link with inline price_data
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: {
                name: `QuickSplit — ${r.username || r.email}`,
              },
              unit_amount: r.amountCents,
              tax_behavior: "inclusive",
            },
            quantity: 1,
          }],
          metadata: {
            split_payment_id: String(splitPaymentId),
            recipient_email: r.email,
            type: "split_payment",
          },
          after_completion: {
            type: "redirect",
            redirect: {
              url: `https://www.quicksplitnow.com/#split-paid?ref=${splitPaymentId}`,
            },
          },
        });

        // Insert recipient record with payment link info
        const insertResult = db.run(
          `INSERT INTO split_payment_recipients 
           (split_payment_id, recipient_id, amount_cents, payment_link_url, payment_status)
           VALUES (?, ?, ?, ?, 'pending')`,
          [splitPaymentId, r.userId, r.amountCents, paymentLink.url]
        );

        recipientRows.push({
          id: insertResult.lastInsertRowid,
          recipient_id: r.userId,
          amount_cents: r.amountCents,
          payment_link_url: paymentLink.url,
          payment_status: "pending",
          email: r.email,
          username: r.username,
        });
      }

      db.run("COMMIT");

      const splitPayment = db
        .query("SELECT id, sender_id, total_amount_cents, status, created_at FROM split_payments WHERE id = ?")
        .get(splitPaymentId);

      res.status(201).json({
        payment: { ...splitPayment, status: "pending", recipients: recipientRows },
        mode: "live",
      });
    } catch (stripeErr) {
      db.run("ROLLBACK");
      console.error("Stripe split payment failed, falling back to simulated:", stripeErr.message);
      return simulateSplitPayment(req, res, resolvedRecipients, totalAmountCents);
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

    const paymentsWithRecipients = payments.map((p) => {
      const recipients = db
        .query(
          `SELECT spr.id, spr.recipient_id, spr.amount_cents, 
                  spr.payment_link_url, spr.payment_status, spr.stripe_session_id,
                  u.email, u.username
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

// GET /api/payments/split/:id/status — Check payment statuses
app.get("/api/payments/split/:id/status", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const splitPayment = db
      .query("SELECT id, sender_id, total_amount_cents, status, created_at FROM split_payments WHERE id = ?")
      .get(id);

    if (!splitPayment) {
      return res.status(404).json({ error: "Split payment not found" });
    }

    const recipients = db
      .query(
        `SELECT spr.id, spr.recipient_id, spr.amount_cents, 
                spr.payment_link_url, spr.payment_status, spr.stripe_session_id,
                u.email, u.username
         FROM split_payment_recipients spr
         JOIN users u ON u.id = spr.recipient_id
         WHERE spr.split_payment_id = ?`
      )
      .all(id);

    res.json({
      payment: { ...splitPayment, recipients },
    });
  } catch (err) {
    console.error("Split status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Stripe webhook ────────────────────────────────────────────────────────

// POST /api/stripe/webhook — Handle Stripe events
app.post("/api/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  if (!stripe) {
    return res.status(200).json({ received: false, reason: "stripe not configured" });
  }

  try {
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      // Fallback: parse JSON body directly (dev mode, no signature verification)
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata || {};
    
    console.log("Checkout completed:", session.id, metadata);

    if (metadata.type === "split_payment") {
      // Update the split payment recipient by matching recipient_email
      db.run(
        `UPDATE split_payment_recipients 
         SET payment_status = 'paid', stripe_session_id = ?
         WHERE payment_status = 'pending'
           AND split_payment_id = ?
           AND id IN (
             SELECT spr.id FROM split_payment_recipients spr 
             JOIN users u ON u.id = spr.recipient_id 
             WHERE spr.split_payment_id = ? AND u.email = ?
             LIMIT 1
           )`,
        [session.id, metadata.split_payment_id, metadata.split_payment_id, metadata.recipient_email]
      );

      // Check if all recipients have paid — if so, mark the split as completed
      const pendingCount = db
        .query(
          "SELECT COUNT(*) as cnt FROM split_payment_recipients WHERE split_payment_id = ? AND payment_status = 'pending'"
        )
        .get(metadata.split_payment_id);
      
      if (pendingCount && pendingCount.cnt === 0) {
        db.run("UPDATE split_payments SET status = 'completed' WHERE id = ?", [
          metadata.split_payment_id,
        ]);
      }
    }

    if (metadata.type === "premium_upgrade") {
      const userId = metadata.user_id;
      if (userId) {
        db.run("UPDATE users SET is_premium = 1 WHERE id = ?", [userId]);
        console.log(`User ${userId} upgraded to premium via checkout session ${session.id}`);
      }
    }
  }

  res.status(200).json({ received: true });
});

// ── Membership / Premium routes ─────────────────────────────────────────────

// GET /api/membership/status — Check premium status
app.get("/api/membership/status", authMiddleware, (req, res) => {
  try {
    const user = db
      .query("SELECT is_premium FROM users WHERE id = ?")
      .get(req.user.id);

    res.json({
      isPremium: user ? Boolean(user.is_premium) : false,
    });
  } catch (err) {
    console.error("Membership status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/membership/upgrade — Create Stripe Checkout for premium
app.post("/api/membership/upgrade", authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ error: "Stripe is not configured. Premium upgrades are unavailable." });
    }

    // Use inline price_data to avoid Managed Payments tax code issues
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          product_data: {
            name: "QuickSplit Premium",
            description: "Premium membership — no fees on withdrawals. $4.99/month.",
          },
          unit_amount: 499,
          tax_behavior: "inclusive",
        },
        quantity: 1,
      }],
      metadata: {
        type: "premium_upgrade",
        user_id: String(req.user.id),
      },
      success_url: `https://www.quicksplitnow.com/#premium-success`,
      cancel_url: `https://www.quicksplitnow.com/#premium`,
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Premium upgrade error:", err.message);
    const message = err.type === "StripeInvalidRequestError" 
      ? `Stripe error: ${err.raw?.message || err.message}`
      : `Server error: ${err.message}`;
    res.status(err.type ? 400 : 500).json({ error: message });
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
