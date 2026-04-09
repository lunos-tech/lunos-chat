import { X, Check, Zap, DollarSign, Gauge } from "lucide-react";
import { DEFAULT_MODELS } from "@/types/chat";

interface Props {
  open: boolean;
  onClose: () => void;
  currentModel: string;
  onSelect: (modelId: string) => void;
}

export default function ModelSelectorModal({ open, onClose, currentModel, onSelect }: Props) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">SELECT MODEL</h2>
            <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {/* Model list */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {DEFAULT_MODELS.map((m) => {
              const isActive = m.id === currentModel;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelect(m.id);
                    onClose();
                  }}
                  className={`group flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-accent-subtle border border-primary/30"
                      : "border border-transparent hover:bg-surface-2"
                  }`}
                >
                  {/* Icon */}
                  <span className="mt-0.5 text-lg leading-none">{m.icon}</span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{m.name}</span>
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
                        {m.provider}
                      </span>
                      {isActive && <Check size={14} className="ml-auto text-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-text-secondary">{m.description}</p>

                    {/* Stats row */}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
                        <DollarSign size={11} />
                        <span className="font-mono">
                          ${m.inputPrice.toFixed(2)} / ${m.outputPrice.toFixed(2)}
                        </span>
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
            })}
          </div>
        </div>
      </div>
    </>
  );
}
