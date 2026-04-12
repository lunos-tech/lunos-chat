import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, Check, Search, Loader2, RefreshCw, AlertCircle, Cpu } from "lucide-react";
import { getStoredProvider } from "./ProviderModal";

/** Standard /v1/models response shape */
interface APIModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
  supportedParameters?: string[];
}

// ─── Public helper: look up supportedParameters for a model ───────────

export function getModelSupportedParams(modelId: string): string[] | null {
  try {
    const raw = localStorage.getItem(MODELS_CACHE_KEY);
    if (!raw) return null;
    const { models } = JSON.parse(raw) as { models: APIModel[] };
    const model = models.find((m) => m.id === modelId);
    return model?.supportedParameters ?? null;
  } catch {
    return null;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentModel: string;
  onSelect: (modelId: string) => void;
}

// ─── localStorage cache ───────────────────────────────────────────────

export const MODELS_CACHE_KEY = "lunos-fetched-models";

function getCachedModels(): APIModel[] | null {
  try {
    const raw = localStorage.getItem(MODELS_CACHE_KEY);
    if (!raw) return null;
    const { models, providerBaseUrl, ts } = JSON.parse(raw);
    const current = getStoredProvider();
    // invalidate if provider changed or older than 10 minutes
    if (!current || current.baseUrl !== providerBaseUrl) return null;
    if (Date.now() - ts > 10 * 60 * 1000) return null;
    return models as APIModel[];
  } catch {
    return null;
  }
}

function setCachedModels(models: APIModel[]) {
  try {
    const current = getStoredProvider();
    localStorage.setItem(
      MODELS_CACHE_KEY,
      JSON.stringify({ models, providerBaseUrl: current?.baseUrl, ts: Date.now() }),
    );
  } catch {
    // ignore
  }
}

// ─── Fuzzy search ─────────────────────────────────────────────────────

function fuzzyMatch(query: string, target: string): { score: number; indices: number[] } | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (q.length === 0) return { score: 0, indices: [] };
  if (q.length > t.length) return null;

  const indices: number[] = [];
  let score = 0;
  let qi = 0;
  let prevMatchIdx = -2;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      indices.push(ti);
      if (ti === prevMatchIdx + 1) score -= 4;
      if (ti === 0 || /[\s\-_./]/.test(t[ti - 1])) score -= 6;
      if (ti === qi) score -= 3;
      score += ti - (prevMatchIdx + 1);
      prevMatchIdx = ti;
      qi++;
    }
  }

  if (qi < q.length) return null;
  score += (t.length - indices[indices.length - 1] - 1) * 0.5;
  return { score, indices };
}

function HighlightText({ text, indices }: { text: string; indices?: number[] }) {
  if (!indices || indices.length === 0) return <>{text}</>;
  const set = new Set(indices);
  return (
    <>
      {text.split("").map((ch, i) =>
        set.has(i) ? (
          <span key={i} className="text-primary font-bold">{ch}</span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function ModelSelectorModal({ open, onClose, currentModel, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [models, setModels] = useState<APIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Fetch models ───────────────────────────────────────────────────

  const fetchModels = useCallback(async (force = false) => {
    const provider = getStoredProvider();
    if (!provider) {
      setError("No AI provider configured");
      return;
    }

    // Check cache first
    if (!force) {
      const cached = getCachedModels();
      if (cached) {
        setModels(cached);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${provider.baseUrl.replace(/\/+$/, "")}/models`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
      }

      const json = await res.json();

      // Standard OpenAI response: { data: [...] }
      const list: APIModel[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      // Sort alphabetically by id
      list.sort((a, b) => a.id.localeCompare(b.id));

      setModels(list);
      setCachedModels(list);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch models");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightIdx(0);
      fetchModels();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, fetchModels]);

  // ── Search / filter ────────────────────────────────────────────────

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return models.map((m) => ({ model: m, score: 0, indices: [] as number[] }));
    }
    return models
      .map((m) => {
        // Search across id and owned_by
        const idMatch = fuzzyMatch(q, m.id);
        const ownerMatch = m.owned_by ? fuzzyMatch(q, m.owned_by) : null;
        const best = [idMatch, ownerMatch].filter(Boolean).sort((a, b) => a!.score - b!.score)[0];
        if (!best) return null;
        return { model: m, score: best.score, indices: idMatch?.indices ?? [] };
      })
      .filter(Boolean)
      .sort((a, b) => a!.score - b!.score) as { model: APIModel; score: number; indices: number[] }[];
  }, [query, models]);

  // Clamp highlight index
  useEffect(() => {
    if (highlightIdx >= results.length) setHighlightIdx(Math.max(0, results.length - 1));
  }, [results.length, highlightIdx]);

  // Scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.children[highlightIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx]);

  const selectModel = useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[highlightIdx]) {
        e.preventDefault();
        selectModel(results[highlightIdx].model.id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [results, highlightIdx, selectModel, onClose],
  );

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
        <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl">
          {/* Search header */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search size={15} className="shrink-0 text-text-tertiary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightIdx(0);
              }}
              placeholder="Search models…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-text-tertiary focus:outline-none"
            />
            <button
              onClick={() => fetchModels(true)}
              disabled={loading}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
              title="Refresh models"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onClose} className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {/* Loading state */}
            {loading && models.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="text-xs text-text-tertiary">Fetching models…</span>
              </div>
            )}

            {/* Error state */}
            {error && models.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle size={16} />
                  <span className="text-xs font-medium">Failed to load models</span>
                </div>
                <p className="max-w-xs text-center text-[11px] text-text-tertiary">{error}</p>
                <button
                  onClick={() => fetchModels(true)}
                  className="mt-1 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {/* No results */}
            {!loading && !error && results.length === 0 && query && (
              <div className="px-3 py-8 text-center text-xs text-text-tertiary">
                No models match "{query}"
              </div>
            )}

            {/* Empty state — no models at all */}
            {!loading && !error && models.length === 0 && !query && (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Cpu size={20} className="text-text-tertiary" />
                <span className="text-xs text-text-tertiary">No models available</span>
                <p className="text-[10px] text-text-tertiary/70">Check your provider configuration</p>
              </div>
            )}

            {/* Model list */}
            {results.map((r, idx) => {
              const m = r.model;
              const isActive = m.id === currentModel;
              const isHighlighted = idx === highlightIdx;

              return (
                <button
                  key={m.id}
                  onClick={() => selectModel(m.id)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-accent-subtle border border-primary/30"
                      : isHighlighted
                      ? "bg-surface-2 border border-transparent"
                      : "border border-transparent hover:bg-surface-2"
                  }`}
                >
                  <Cpu size={14} className={`shrink-0 ${isActive ? "text-primary" : "text-text-tertiary"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        <HighlightText text={m.id} indices={r.indices} />
                      </span>
                      {m.owned_by && (
                        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
                          {m.owned_by}
                        </span>
                      )}
                      {isActive && <Check size={14} className="ml-auto shrink-0 text-primary" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer info */}
          <div className="border-t border-border px-4 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-tertiary">
                {models.length > 0 ? `${models.length} model${models.length !== 1 ? "s" : ""} available` : ""}
              </span>
              {loading && models.length > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                  <Loader2 size={10} className="animate-spin" /> Refreshing…
                </span>
              )}
              {error && models.length > 0 && (
                <span className="text-[10px] text-destructive/80">Refresh failed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
