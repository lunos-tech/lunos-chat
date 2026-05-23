// Run: node backend/test.js
// Make sure the backend is running first: pnpm backend:dev
// Usage: OPENAI_API_KEY=sk-... GROQ_API_KEY=gsk_... GOOGLE_API_KEY=... node backend/test.js

const BASE = "http://localhost:3001";
const body = {
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Say hello in 5 words" }],
  stream: true,
};

async function testStream(name, url, headers, payload = body) {
  console.log(`--- ${name} ---`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
    console.log(`Status: ${res.status}`);
    if (!res.ok) { console.log(await res.text(), "\n"); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      process.stdout.write(decoder.decode(value));
    }
    console.log("\n");
  } catch (err) {
    console.error(`[FAIL]`, err.message, "\n");
  }
}

// OpenAI
await testStream(
  "OpenAI stream",
  `${BASE}/v1/openai/v1/chat/completions`,
  { Authorization: `Bearer ${process.env.OPENAI_API_KEY || "test-key"}` },
);

// Groq
await testStream(
  "Groq stream",
  `${BASE}/v1/groq/v1/chat/completions`,
  { Authorization: `Bearer ${process.env.GROQ_API_KEY || "test-key"}` },
  { ...body, model: "llama-3.1-8b-instant" },
);

// Google AI
await testStream(
  "Google AI stream",
  `${BASE}/v1/google/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${process.env.GOOGLE_API_KEY || "AIzaSyBFsjAbTo1KQh65UfX6zbt_pHmhe2Nne4s"}`,
  {},
  { contents: [{ parts: [{ text: "Say hello in 5 words" }] }] },
);
