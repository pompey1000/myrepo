/**
 * ClearScore AI — Customer-support chat endpoint.
 *
 * Server-only. Exposes a `chatWithAI` `createServerFn({ method: "POST" })`
 * that the marketing site / dashboard can call to ask the AI about ClearScore
 * AI itself: how the product works, pricing, the dispute process, security,
 * and general credit education.
 *
 * The chat runs through `chatCompletion()` in `~/lib/ai`, which is the
 * non-JSON sibling of the typed `complete()` helper used by the dispute
 * flows. Cost + usage is still recorded in `api_logs` so we can keep an eye
 * on spend the same way we do for the other AI calls.
 *
 * No auth is enforced: the chat is meant to be reachable from the public
 * landing page so prospects can ask questions before signing up. When a
 * logged-in user calls this, their id is passed through and the call shows
 * up in their per-user cost rollup. The front-end doesn't currently send an
 * id, so most calls land with `user_id = NULL`.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { chatCompletion, type ChatMessage } from "~/lib/ai";

// =============================================================================
// System prompt
// =============================================================================

const SYSTEM_CHAT = `You are a friendly, knowledgeable customer-support agent for **ClearScore AI**, an AI-powered credit-repair service.

Your job is to answer visitor questions about the product. Be warm, concise, and concrete — never oversell, never guarantee outcomes, and never give legal or financial advice.

Topics you can speak to with confidence:

**What ClearScore AI does**
- Scans credit reports from Equifax, Experian, and TransUnion for errors
- Uses AI to flag items the consumer has a good-faith basis to dispute
- Generates FCRA-compliant dispute letters (the consumer reviews and sends)
- Tracks credit score changes over time

**Pricing**
- Starter: **$19/month** — full report analysis, AI dispute generation, score tracking
- Premium: **$39/month** — adds priority disputes, credit-building recommendations, and personalized coaching
- One-Time Audit: **$49** — a single deep-dive report analysis with no ongoing subscription

**The dispute process**
- User uploads their credit report (PDF) or connects a bureau
- Our AI flags items that look inaccurate, incomplete, or unverifiable
- We generate a dispute letter that the user reviews, edits if needed, and mails to the bureau
- The bureau has 30 days (under the Fair Credit Reporting Act) to investigate and respond
- Score impact (if any) shows up in the next 30–60 days

**Data security and privacy**
- Reports are encrypted in transit and at rest
- We never sell user data
- We don't share credit reports with lenders or third parties
- Users can delete their account and data at any time

**What kinds of errors we find**
- Late payments reported outside the 7-year window
- Charge-offs or collections with stale balances
- Duplicate trade lines (same creditor listed twice)
- Accounts the consumer doesn't recognize (possible identity error)
- Incorrect balances, credit limits, or payment statuses
- Outdated information (e.g., a paid collection still showing as unpaid)
- Unauthorized hard inquiries

**Timeline for results**
- A single dispute cycle takes 30–45 days (bureau response + score update)
- Most users see early movement on their score within 60–90 days
- A full repair of a damaged report typically takes 6–12 months
- Results are not guaranteed — every credit profile is different

**General credit education**
- Payment history is the biggest factor in a FICO score (~35%)
- Credit utilization (revolving balances ÷ limits) is the second biggest (~30%)
- Hard inquiries stay on a report for 24 months but their impact fades fast
- Closing old cards can hurt your score by lowering total credit age and raising utilization

**Style rules**
- Keep every response to 2–3 short paragraphs. No walls of text.
- Use plain language. Don't quote statutes unless the user asks.
- If a question is outside your scope (legal advice, tax, investment), say so and suggest a qualified professional.
- Don't promise outcomes ("you'll get a 100-point increase"). Use ranges or say "results vary".
- If you don't know the answer, say so and offer to connect the user with the team.
- Never invent features, prices, or policies that aren't listed above. If a product detail isn't covered, tell the user to email support@clearscore.ai.`;

// =============================================================================
// Request / response types
// =============================================================================

/** A single turn of prior conversation the client wants the model to see. */
const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const chatSchema = z.object({
  /** The user's current message. */
  message: z.string().min(1).max(2000),
  /**
   * Optional prior turns (most-recent-last). Capped at 20 items to keep
   * the prompt from blowing up; the front-end should also limit history
   * to the last few exchanges.
   */
  history: z.array(historyItemSchema).max(20).optional(),
  /** Optional user id — when present, the call is attributed in api_logs. */
  user_id: z.string().uuid().optional(),
});

export interface ChatResponse {
  success: true;
  reply: string;
  tokens_used: number;
}

export interface ChatError {
  success: false;
  error: string;
  /** Mirror of `AIServiceError.code` when the failure is from the AI layer. */
  code?:
    | "missing_api_key"
    | "openai_error"
    | "invalid_response"
    | "rate_limited"
    | "schema_validation"
    | "validation_error";
}

// =============================================================================
// Inner handler — exported separately so it can be unit-tested without
// going through the TanStack Start runtime.
// =============================================================================

export type ChatInput = z.infer<typeof chatSchema>;

export const handleChat = async (
  data: ChatInput,
): Promise<ChatResponse | ChatError> => {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_CHAT },
  ];

  if (data.history) {
    for (const h of data.history) {
      messages.push({ role: h.role, content: h.content });
    }
  }

  messages.push({ role: "user", content: data.message });

  try {
    const { text, tokens_used } = await chatCompletion({
      endpoint: "chatWithAI",
      user_id: data.user_id ?? null,
      messages,
      temperature: 0.4,
    });

    return {
      success: true,
      reply: text.trim(),
      tokens_used,
    };
  } catch (err) {
    // Re-use the AIServiceError code surface so the client can render
    // a helpful message (e.g. "our AI is busy, try again" for 429).
    if (err && typeof err === "object" && "code" in err) {
      const e = err as { code?: string; message?: string };
      return {
        success: false,
        error:
          e.message ??
          "The chat service is unavailable right now. Please try again in a moment.",
        code: e.code as ChatError["code"],
      };
    }
    return {
      success: false,
      error: "The chat service is unavailable right now. Please try again in a moment.",
      code: "openai_error",
    };
  }
};

// =============================================================================
// Server function
// =============================================================================

export const chatWithAI = createServerFn({ method: "POST" })
  .validator(chatSchema)
  .handler(async ({ data }) => handleChat(data));
