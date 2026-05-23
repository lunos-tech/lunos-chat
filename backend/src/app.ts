import { Hono } from "hono";
import { cors } from "hono/cors";
import { decryptApiKey } from "./crypto";

type Bindings = {
  RSA_PRIVATE_KEY: string;
  RSA_PUBLIC_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

const PROVIDERS: Record<string, string> = {
  lunos: "https://api.lunos.tech/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta/openai",
  groq: "https://api.groq.com/openai/v1",
};

const SKIP_ENCRYPTION_PROVIDERS = ["custom"];

// GET /public-key
app.get("/public-key", (c) => {
  const publicKey = c.env.RSA_PUBLIC_KEY;
  return c.json({ publicKey });
});

// Proxy: /v1/:provider/*
app.all("/v1/:provider/*", async (c) => {
  const provider = c.req.param("provider");
  const baseUrl = PROVIDERS[provider];
  if (!baseUrl) {
    return c.json({ error: `Unknown provider: ${provider}` }, 400);
  }

  const subPath = c.req.path.replace(`/v1/${provider}/`, "");
  const query = new URL(c.req.url).search;
  const targetUrl = `${baseUrl}/${subPath}${query}`;

  const headers: Record<string, string> = { "content-type": "application/json" };

  if (provider === "anthropic") {
    headers["anthropic-version"] = "2023-06-01";
  }

  if (!SKIP_ENCRYPTION_PROVIDERS.includes(provider)) {
    const encrypted = c.req.header("x-encrypted-api-key");
    if (encrypted) {
      try {
        const apiKey = await decryptApiKey(encrypted, c.env.RSA_PRIVATE_KEY);
        if (provider === "anthropic") {
          headers["x-api-key"] = apiKey;
        } else {
          headers["authorization"] = `Bearer ${apiKey}`;
        }
      } catch {
        return c.json({ error: "Failed to decrypt API key" }, 400);
      }
    }

    const encryptedGoog = c.req.header("x-encrypted-goog-key");
    if (encryptedGoog) {
      try {
        const apiKey = await decryptApiKey(encryptedGoog, c.env.RSA_PRIVATE_KEY);
        headers["x-goog-api-key"] = apiKey;
      } catch {
        return c.json({ error: "Failed to decrypt API key" }, 400);
      }
    }
  } else {
    const auth = c.req.header("authorization");
    if (auth) headers["authorization"] = auth;
    const googKey = c.req.header("x-goog-api-key");
    if (googKey) headers["x-goog-api-key"] = googKey;
  }

  const appId = c.req.header("x-app-id");
  if (appId) headers["x-app-id"] = appId;

  try {
    const method = c.req.method;
    const fetchOpts: RequestInit = { method, headers };

    if (method !== "GET" && method !== "HEAD") {
      fetchOpts.body = await c.req.text();
    }

    const upstream = await fetch(targetUrl, fetchOpts);

    // Stream the response back
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "Upstream request failed", detail: message }, 502);
  }
});

export default app;
