import { useState, useEffect } from "react";
import { X, Check, ExternalLink, Key, Globe, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  encryptedApiKey?: string;
  version?: number;
}

const CURRENT_CONFIG_VERSION = 2;

const DEFAULT_PROVIDERS: (Omit<ProviderConfig, "apiKey"> & { apiKeyUrl?: string; icon?: string })[] = [
  { id: "lunos", name: "Lunos AI", baseUrl: "https://api.lunos.tech/v1", apiKeyUrl: "https://lunos.tech/dashboard", icon: "/logo.png" },
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", apiKeyUrl: "https://platform.openai.com/api-keys", icon: "/provider/openai.png" },
  { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1", apiKeyUrl: "https://console.anthropic.com/settings/keys", icon: "/provider/anthropic.svg" },
  { id: "google", name: "Google AI", baseUrl: "https://generativelanguage.googleapis.com/v1", apiKeyUrl: "https://aistudio.google.com/app/apikey", icon: "/provider/gemini.svg" },
  { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1", apiKeyUrl: "https://console.groq.com/keys", icon: "/provider/groq.png" },
  { id: "custom", name: "Custom Gateway", baseUrl: "" },
];

const STORAGE_KEY = "lunos-provider-config";
const ALL_KEYS_STORAGE_KEY = "lunos-provider-keys";

// ─── Multi-provider key storage ──────────────────────────────────────
// Stores encrypted API keys for all providers so users don't re-enter them on switch.

interface StoredProviderEntry {
  apiKey?: string;           // Only for non-encrypted providers (custom)
  encryptedApiKey?: string;  // RSA-encrypted key for proxy providers
  baseUrl?: string;
  keyHint: string;           // Last 4 chars for display (e.g., "••••ab3f")
}

interface StoredProviderKeys {
  [providerId: string]: StoredProviderEntry;
}

function getAllStoredKeys(): StoredProviderKeys {
  try {
    const raw = localStorage.getItem(ALL_KEYS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredProviderKeys;
  } catch {
    return {};
  }
}

function maskKey(apiKey: string): string {
  if (apiKey.length <= 4) return "••••";
  return "••••" + apiKey.slice(-4);
}

async function storeProviderKeyEncrypted(providerId: string, apiKey: string, baseUrl?: string) {
  const { shouldEncrypt, encryptApiKey } = await import("@/lib/proxy");
  const all = getAllStoredKeys();
  const entry: StoredProviderEntry = { keyHint: maskKey(apiKey) };

  if (shouldEncrypt(providerId)) {
    entry.encryptedApiKey = await encryptApiKey(apiKey);
  } else {
    entry.apiKey = apiKey;
  }

  if (baseUrl) entry.baseUrl = baseUrl;
  all[providerId] = entry;
  localStorage.setItem(ALL_KEYS_STORAGE_KEY, JSON.stringify(all));
}

export function getStoredEntryForProvider(providerId: string): StoredProviderEntry | null {
  const all = getAllStoredKeys();
  return all[providerId] ?? null;
}

// ─── Active provider storage ─────────────────────────────────────────

export function getStoredProvider(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw) as ProviderConfig;
    if (config.version !== CURRENT_CONFIG_VERSION) return null;
    return config;
  } catch {
    return null;
  }
}

export function storeProvider(config: ProviderConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, version: CURRENT_CONFIG_VERSION }));
}

export function isProviderConfigured(): boolean {
  return getStoredProvider() !== null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (config: ProviderConfig) => void;
}

export default function ProviderModal({ open, onClose, onSave }: Props) {
  const [selectedId, setSelectedId] = useState("lunos");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedProviderIds, setSavedProviderIds] = useState<Set<string>>(new Set());
  const [usingSavedKey, setUsingSavedKey] = useState(false);
  const [proxyReachable, setProxyReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      // Load which providers have saved keys
      const allKeys = getAllStoredKeys();
      setSavedProviderIds(new Set(Object.keys(allKeys)));

      const stored = getStoredProvider();
      if (stored) {
        setSelectedId(stored.id);
        setApiKey("");
        setUsingSavedKey(true);
        setBaseUrl(stored.baseUrl);
      } else {
        setSelectedId("lunos");
        setApiKey("");
        setUsingSavedKey(false);
        setBaseUrl(DEFAULT_PROVIDERS[0].baseUrl);
      }

      // Prefetch public key so encryption is ready on save
      import("@/lib/proxy").then(({ prefetchPublicKey }) =>
        prefetchPublicKey().then((ok) => setProxyReachable(ok))
      );
    }
  }, [open]);

  useEffect(() => {
    const provider = DEFAULT_PROVIDERS.find((p) => p.id === selectedId);
    if (provider && provider.id !== "custom") {
      setBaseUrl(provider.baseUrl);
    }
    // Check if this provider has a saved encrypted key
    const savedEntry = getStoredEntryForProvider(selectedId);
    if (savedEntry) {
      setUsingSavedKey(true);
      setApiKey("");
      if (selectedId === "custom" && savedEntry.baseUrl) {
        setBaseUrl(savedEntry.baseUrl);
      }
    } else {
      setUsingSavedKey(false);
      // Only clear if switching away from the currently active provider
      const active = getStoredProvider();
      if (active?.id !== selectedId) {
        setApiKey("");
      }
    }
  }, [selectedId]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const provider = DEFAULT_PROVIDERS.find((p) => p.id === selectedId)!;
      const config: ProviderConfig = {
        id: selectedId,
        name: provider.name,
        baseUrl: selectedId === "custom" ? baseUrl : provider.baseUrl,
        apiKey: "",
      };

      // If using a previously saved key (no new key entered), restore from stored entry
      if (usingSavedKey && !apiKey.trim()) {
        const savedEntry = getStoredEntryForProvider(selectedId);
        if (savedEntry) {
          if (savedEntry.encryptedApiKey) {
            config.encryptedApiKey = savedEntry.encryptedApiKey;
          } else if (savedEntry.apiKey) {
            config.apiKey = savedEntry.apiKey;
          }
          storeProvider(config);
          onSave(config);
          onClose();
          return;
        }
      }

      const { shouldEncrypt, encryptApiKey } = await import("@/lib/proxy");
      if (shouldEncrypt(selectedId)) {
        config.encryptedApiKey = await encryptApiKey(apiKey);
      } else {
        config.apiKey = apiKey;
      }

      // Persist encrypted key to multi-provider store for quick switching
      await storeProviderKeyEncrypted(selectedId, apiKey, selectedId === "custom" ? baseUrl : undefined);

      storeProvider(config);
      onSave(config);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to encrypt API key";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-lg border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            <h2 className="text-sm font-semibold tracking-wide text-foreground">AI PROVIDER</h2>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">SELECT PROVIDER</label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_PROVIDERS.map((provider) => {
                return (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedId(provider.id)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${selectedId === provider.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface-2 text-foreground hover:border-primary/30"
                      }`}
                  >
                    {provider.icon ? (
                      <img src={provider.icon} alt={provider.name} className="w-4 h-4 object-contain shrink-0" />
                    ) : (
                      <Globe size={16} className={`shrink-0 ${selectedId === provider.id ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                    <span className="flex-1 truncate">{provider.name}</span>
                    {selectedId === provider.id ? (
                      <Check size={14} className="shrink-0" />
                    ) : savedProviderIds.has(provider.id) ? (
                      <Key size={12} className="shrink-0 text-green-500" />
                    ) : provider.id === "lunos" ? (
                      <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary">
                        REC
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wider text-text-tertiary">API KEY</label>
              {DEFAULT_PROVIDERS.find((p) => p.id === selectedId)?.apiKeyUrl && (
                <a
                  href={DEFAULT_PROVIDERS.find((p) => p.id === selectedId)?.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  Get API Key <ExternalLink size={10} />
                </a>
              )}
            </div>
            {usingSavedKey && !apiKey.trim() ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2.5">
                  <Key size={14} className="text-green-500" />
                  <span className="flex-1 font-mono text-xs text-foreground">
                    {getStoredEntryForProvider(selectedId)?.keyHint ?? "••••••••"}
                  </span>
                  <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[9px] font-bold text-green-500">SAVED</span>
                </div>
                <button
                  onClick={() => { setUsingSavedKey(false); setApiKey(""); }}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  Enter a new key instead
                </button>
              </div>
            ) : (
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${DEFAULT_PROVIDERS.find((p) => p.id === selectedId)?.name} API key`}
                  className="w-full rounded-md border border-border bg-surface-2 py-2.5 pl-9 pr-16 font-mono text-xs text-foreground placeholder:text-text-tertiary focus:border-primary/40 focus:outline-none"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[10px] font-medium text-text-tertiary hover:text-foreground"
                >
                  {showKey ? "HIDE" : "SHOW"}
                </button>
              </div>
            )}
          </div>

          {/* Base URL (editable for custom) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold tracking-wider text-text-tertiary">BASE URL</label>
              {selectedId !== "custom" && (
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] text-text-tertiary">AUTO</span>
              )}
            </div>
            <div className="relative">
              <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                disabled={selectedId !== "custom"}
                placeholder="https://your-gateway.com/v1"
                className="w-full rounded-md border border-border bg-surface-2 py-2.5 pl-9 pr-3 font-mono text-xs text-foreground placeholder:text-text-tertiary focus:border-primary/40 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Info */}
          {selectedId === "lunos" && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-text-secondary">
                <span className="font-semibold text-primary">Recommended.</span> Lunos AI provides unified access to all major models with a single API key, automatic failover, and built-in rate limiting.
              </p>
            </div>
          )}

          {/* Proxy unreachable warning */}
          {proxyReachable === false && selectedId !== "custom" && (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-500" />
                <p className="text-xs leading-relaxed text-text-secondary">
                  <span className="font-semibold text-yellow-500">Proxy unreachable.</span> Cannot connect to the encryption server. Make sure the backend proxy is running.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={(!apiKey.trim() && !usingSavedKey) || saving}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
