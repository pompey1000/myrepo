/**
 * Test script for the chatWithAI server function.
 *
 * Calls the inner `handleChat` directly (bypassing the TanStack Start
 * server-fn wrapper, which needs the runtime AsyncLocalStorage context).
 *
 * Run with: bun run scripts/test-chat.ts
 */

import { handleChat } from "../src/lib/chat";

async function main() {
  console.log("[test] handleChat: real customer question with history");
  const r1 = await handleChat({
    message: "How much does ClearScore AI cost?",
    history: [
      { role: "user", content: "Hi!" },
      {
        role: "assistant",
        content:
          "Hi! I'm the ClearScore AI support assistant. What can I help you with?",
      },
    ],
  });
  console.log(JSON.stringify(r1, null, 2));

  console.log("\n[test] handleChat: question about dispute process");
  const r2 = await handleChat({
    message: "How long does a dispute take?",
  });
  console.log(JSON.stringify(r2, null, 2));

  console.log("\n[test] handleChat: question about data security");
  const r3 = await handleChat({
    message: "Is my credit report data safe with you?",
  });
  console.log(JSON.stringify(r3, null, 2));

  console.log("\n[test] handleChat: empty message");
  const r4 = await handleChat({ message: "" });
  console.log(JSON.stringify(r4, null, 2));

  console.log("\n[test] handleChat: 3000-char message (over 2000 limit)");
  const r5 = await handleChat({ message: "a".repeat(3000) });
  console.log(JSON.stringify(r5, null, 2));

  console.log("\n[test] handleChat: history with bad role");
  // @ts-expect-error — deliberately bad input to confirm validator semantics
  const r6 = await handleChat({
    message: "test",
    history: [{ role: "system", content: "I am a system prompt" }],
  });
  console.log(JSON.stringify(r6, null, 2));
}

main().catch((err) => {
  console.error("[test] uncaught:", err);
  process.exit(1);
});
