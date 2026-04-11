import { useState, useEffect } from "react";
import { X, Check, ExternalLink, Key, Globe } from "lucide-react";

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
}

const DEFAULT_PROVIDERS: Omit<ProviderConfig, "apiKey">[] = [
  { id: "lunos", name: "Lunos AI", baseUrl: "https://api.lunos.ai/v1" },
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1" },
  { id: "google", name: "Google AI", baseUrl: "https://generativelanguage.googleapis.com/v1" },
  { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
  { id: "custom", name: "Custom Gateway", baseUrl: "" },
];

const STORAGE_KEY = "lunos-provider-config";

export function getStoredProvider(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeProvider(config: ProviderConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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

  useEffect(() => {
    if (open) {
      const stored = getStoredProvider();
      if (stored) {
        setSelectedId(stored.id);
        setApiKey(stored.apiKey);
        setBaseUrl(stored.baseUrl);
      } else {
        setSelectedId("lunos");
        setApiKey("");
        setBaseUrl(DEFAULT_PROVIDERS[0].baseUrl);
      }
    }
  }, [open]);

  useEffect(() => {
    const provider = DEFAULT_PROVIDERS.find((p) => p.id === selectedId);
    if (provider && provider.id !== "custom") {
      setBaseUrl(provider.baseUrl);
    }
  }, [selectedId]);

  if (!open) return null;

  const handleSave = () => {
    const provider = DEFAULT_PROVIDERS.find((p) => p.id === selectedId)!;
    const config: ProviderConfig = {
      id: selectedId,
      name: provider.name,
      baseUrl: selectedId === "custom" ? baseUrl : provider.baseUrl,
      apiKey,
    };
    storeProvider(config);
    onSave(config);
    onClose();
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
              {DEFAULT_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedId(provider.id)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    selectedId === provider.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface-2 text-foreground hover:border-primary/30"
                  }`}
                >
                  {selectedId === provider.id && <Check size={12} />}
                  <span className={selectedId === provider.id ? "" : "ml-5"}>{provider.name}</span>
                  {provider.id === "lunos" && (
                    <span className="ml-auto rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-primary">
                      REC
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">API KEY</label>
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
            disabled={!apiKey.trim()}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
