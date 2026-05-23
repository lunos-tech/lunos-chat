/**
 * Cloudflare Worker entry point.
 *
 * Environment variables (set via wrangler secrets or wrangler.toml [vars]):
 *   - RSA_PRIVATE_KEY: PEM-encoded RSA private key
 *   - RSA_PUBLIC_KEY: PEM-encoded RSA public key
 */
import app from "./app";

export default app;
