/**
 * Node.js / VPS entry point using @hono/node-server.
 *
 * Reads RSA keys from:
 *   - Environment variables RSA_PRIVATE_KEY / RSA_PUBLIC_KEY, or
 *   - PEM files at backend/private.pem and backend/public.pem
 */
import { serve } from "@hono/node-server";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, "..");

function loadKey(envVar: string, filename: string): string {
  if (process.env[envVar]) return process.env[envVar]!;
  const filePath = path.join(BACKEND_DIR, filename);
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
  throw new Error(`Missing ${envVar} env var or ${filename} file`);
}

const RSA_PUBLIC_KEY = loadKey("RSA_PUBLIC_KEY", "public.pem");
const RSA_PRIVATE_KEY = loadKey("RSA_PRIVATE_KEY", "private.pem");

// Inject env bindings for Hono context
const originalFetch = app.fetch;
app.fetch = (request: Request, env?: any, ctx?: any) => {
  return originalFetch.call(app, request, { RSA_PUBLIC_KEY, RSA_PRIVATE_KEY, ...env }, ctx);
};

const PORT = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Proxy running on :${info.port}`);
});
