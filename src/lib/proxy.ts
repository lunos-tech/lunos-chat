const PROXY_BASE_URL = import.meta.env.VITE_PROXY_URL?.replace(/\/+$/, "") || "https://proxy.lunos.tech";

const PROXY_PROVIDERS = ["lunos", "openai", "anthropic", "google", "groq"];
const ENCRYPT_PROVIDERS = ["lunos", "openai", "anthropic", "google", "groq"];

let cachedPublicKey: CryptoKey | null = null;

async function fetchPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;
  let res: Response;
  try {
    res = await fetch(`${PROXY_BASE_URL}/public-key`);
  } catch {
    throw new Error(`Cannot reach proxy server at ${PROXY_BASE_URL}. Make sure the backend is running.`);
  }
  if (!res.ok) throw new Error(`Public key endpoint returned ${res.status}`);
  const { publicKey } = await res.json();
  if (!publicKey) throw new Error("Public key response is empty");
  const pem = publicKey.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const binary = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  cachedPublicKey = await crypto.subtle.importKey(
    "spki",
    binary,
    { name: "RSA-OAEP", hash: "SHA-1" },
    false,
    ["encrypt"],
  );
  return cachedPublicKey;
}

/**
 * Prefetch and cache the public key from the proxy server.
 * Call this early (e.g., when the provider modal opens) so encryption
 * is ready by the time the user clicks Save.
 * Returns true if successful, false otherwise.
 */
export async function prefetchPublicKey(): Promise<boolean> {
  try {
    await fetchPublicKey();
    return true;
  } catch {
    return false;
  }
}

export async function encryptApiKey(apiKey: string): Promise<string> {
  const key = await fetchPublicKey();
  const encoded = new TextEncoder().encode(apiKey);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, encoded);
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export function shouldUseProxy(providerId: string): boolean {
  return PROXY_PROVIDERS.includes(providerId);
}

export function shouldEncrypt(providerId: string): boolean {
  return ENCRYPT_PROVIDERS.includes(providerId);
}

export function getProxyBaseUrl(providerId: string): string {
  return `${PROXY_BASE_URL}/v1/${providerId}`;
}
