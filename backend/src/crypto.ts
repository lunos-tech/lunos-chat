/**
 * RSA-OAEP decryption using Web Crypto API.
 * Works in both Cloudflare Workers and Node.js 18+.
 */

let cachedKey: CryptoKey | null = null;
let cachedPem: string | null = null;

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  if (cachedKey && cachedPem === pem) return cachedKey;

  const pemBody = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const binary = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  cachedKey = await crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSA-OAEP", hash: "SHA-1" },
    false,
    ["decrypt"],
  );
  cachedPem = pem;
  return cachedKey;
}

export async function decryptApiKey(encryptedBase64: string, privateKeyPem: string): Promise<string> {
  const key = await importPrivateKey(privateKeyPem);
  const buffer = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, key, buffer);
  return new TextDecoder().decode(decrypted);
}
