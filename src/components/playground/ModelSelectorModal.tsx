import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, Check, Zap, DollarSign, Gauge, Search } from "lucide-react";
import { DEFAULT_MODELS, type ModelConfig } from "@/types/chat";

interface Props {
  open: boolean;
  onClose: () => void;
  currentModel: string;
  onSelect: (modelId: string) => void;
}

/**
 * Fuzzy match: returns a score (lower = better match) and the matched char indices.
 * Returns null if no match. Supports out-of-order substring matching with
 * bonuses for consecutive chars, word-boundary matches, and prefix matches.
 */
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

      // Consecutive bonus
      if (ti === prevMatchIdx + 1) {
        score -= 4;
      }

      // Word boundary bonus (start of word)
      if (ti === 0 || /[\s\-_./]/.test(t[ti - 1])) {
        score -= 6;
      }

      // Prefix bonus
      if (ti === qi) {
        score -= 3;
      }

      // Distance penalty
      score += ti - (prevMatchIdx + 1);

      prevMatchIdx = ti;
      qi++;
    }
  }

  if (qi < q.length) return null;

  // Penalty for unmatched tail
  score += (t.length - indices[indices.length - 1] - 1) * 0.5;

  return { score, indices };
}

function scoreModel(query: string, model: ModelConfig): { score: number; indices: Map<string, number[]> } | null {
  if (!query) return { score: 0, indices: new Map() };

  const fields = [
    { key: "name", value: model.name, weight: 1 },
    { key: "provider", value: model.provider, weight: 1.5 },
    { key: "id", value: model.id, weight: 2 },
  ];

  let bestScore: number | null = null;
  const allIndices = new Map<string, number[]>();

  for (const { key, value, weight } of fields) {
    const result = fuzzyMatch(query, value);
    if (result) {
      const weighted = result.score * weight;
      allIndices.set(key, result.indices);
      if (bestScore === null || weighted < bestScore) {
        bestScore = weighted;
      }
    }
  }

  if (bestScore === null) return null;
  return { score: bestScore, indices: allIndices };
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
        )
      )}
    </>
  );
}

export default function ModelSelectorModal({ open, onClose, currentModel, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return DEFAULT_MODELS.map((m) => ({ model: m, score: 0, indices: new Map<string, number[]>() }));
    }
    return DEFAULT_MODELS
      .map((m) => {
        const result = scoreModel(query.trim(), m);
        return result ? { model: m, ...result } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.score - b!.score) as { model: ModelConfig; score: number; indices: Map<string, number[]> }[];
  }, [query]);

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
    [onSelect, onClose]
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
    [results, highlightIdx, selectModel, onClose]
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
            <button onClick={onClose} className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-text-tertiary">
                No models match "{query}"
              </div>
            ) : (
              results.map((r, idx) => {
                const m = r.model;
                const isActive = m.id === currentModel;
                const isHighlighted = idx === highlightIdx;
                return (
                  <button
                    key={m.id}
                    onClick={() => selectModel(m.id)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`group flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-accent-subtle border border-primary/30"
                        : isHighlighted
                        ? "bg-surface-2 border border-transparent"
                        : "border border-transparent hover:bg-surface-2"
                    }`}
                  >
                    <span className="mt-0.5 text-lg leading-none">{m.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          <HighlightText text={m.name} indices={r.indices.get("name")} />
                        </span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
                          <HighlightText text={m.provider} indices={r.indices.get("provider")} />
                        </span>
                        {isActive && <Check size={14} className="ml-auto text-primary" />}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                          <DollarSign size={11} />
                          <span className="font-mono">${m.inputPrice.toFixed(2)} / ${m.outputPrice.toFixed(2)}</span>
                          <span className="text-text-tertiary/60">per 1M tok</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                          <Gauge size={11} />
                          <span className="font-mono">{m.avgTps} tok/s</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                          <Zap size={11} />
                          <span className="font-mono">{(m.maxTokens / 1000).toFixed(0)}K ctx</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
