import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB_KEY_PATH = path.join(__dirname, "public.pem");
const PRIV_KEY_PATH = path.join(__dirname, "private.pem");

let publicKey, privateKey;

if (fs.existsSync(PUB_KEY_PATH) && fs.existsSync(PRIV_KEY_PATH)) {
  publicKey = fs.readFileSync(PUB_KEY_PATH, "utf8");
  privateKey = fs.readFileSync(PRIV_KEY_PATH, "utf8");
} else {
  const pair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 1024,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  publicKey = pair.publicKey;
  privateKey = pair.privateKey;
  fs.writeFileSync(PUB_KEY_PATH, publicKey);
  fs.writeFileSync(PRIV_KEY_PATH, privateKey);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Providers that DON'T need encryption (lunos uses its own key, custom is user-managed)
const SKIP_ENCRYPTION_PROVIDERS = ["lunos", "custom"];

function decryptApiKey(encryptedBase64) {
  const buffer = Buffer.from(encryptedBase64, "base64");
  return crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    buffer
  ).toString("utf8");
}

const PROVIDERS = {
  openai: "https://api.openai.com",
  google: "https://generativelanguage.googleapis.com",
  groq: "https://api.groq.com/openai",
};

// Endpoint: GET /public-key
app.get("/public-key", (_req, res) => {
  res.json({ publicKey });
});

// Proxy: POST /v1/:provider/*
app.all("/v1/:provider/*", async (req, res) => {
  const { provider } = req.params;
  const baseUrl = PROVIDERS[provider];
  if (!baseUrl) return res.status(400).json({ error: `Unknown provider: ${provider}` });

  const path = req.params[0];
  const query = new URLSearchParams(req.query).toString();
  const targetUrl = `${baseUrl}/${path}${query ? `?${query}` : ""}`;

  const headers = { "content-type": "application/json" };

  // Decrypt API key if provider requires encryption
  if (!SKIP_ENCRYPTION_PROVIDERS.includes(provider)) {
    const encrypted = req.headers["x-encrypted-api-key"];
    if (encrypted) {
      try {
        const apiKey = decryptApiKey(encrypted);
        headers["authorization"] = `Bearer ${apiKey}`;
      } catch {
        return res.status(400).json({ error: "Failed to decrypt API key" });
      }
    }
    // Google uses a different header
    const encryptedGoog = req.headers["x-encrypted-goog-key"];
    if (encryptedGoog) {
      try {
        const apiKey = decryptApiKey(encryptedGoog);
        headers["x-goog-api-key"] = apiKey;
      } catch {
        return res.status(400).json({ error: "Failed to decrypt API key" });
      }
    }
  } else {
    if (req.headers.authorization) headers["authorization"] = req.headers.authorization;
    if (req.headers["x-goog-api-key"]) headers["x-goog-api-key"] = req.headers["x-goog-api-key"];
  }

  try {
    const fetchOpts = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, fetchOpts);

    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);

    if (upstream.body) {
      const reader = upstream.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); return; }
          res.write(value);
        }
      };
      await pump();
    } else {
      res.end(await upstream.text());
    }
  } catch (err) {
    res.status(502).json({ error: "Upstream request failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy running on :${PORT}`));
