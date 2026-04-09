import { useState } from "react";
import { X, Bookmark, ChevronRight } from "lucide-react";
import type { ModelParams } from "@/types/chat";
import { DEFAULT_MODELS, DEFAULT_PRESETS } from "@/types/chat";
import ModelSelectorModal from "./ModelSelectorModal";

interface Props {
  model: string;
  onModelChange: (m: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (p: string) => void;
  params: ModelParams;
  onParamsChange: (p: ModelParams) => void;
  open: boolean;
  onClose: () => void;
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">{label}</label>
        <span className="font-mono text-xs text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

export default function ControlPanel({ model, onModelChange, systemPrompt, onSystemPromptChange, params, onParamsChange, open, onClose }: Props) {
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const modelInfo = DEFAULT_MODELS.find((m) => m.id === model);

  const updateParam = (key: keyof ModelParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-background/80 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-card transition-transform duration-200 ease-out lg:relative lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        } ${open ? "" : "lg:hidden"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold tracking-wide text-foreground">CONTROLS</span>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Model Selector - opens modal */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">MODEL</label>
            <button
              onClick={() => setModelModalOpen(true)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                {modelInfo && <span className="text-base">{modelInfo.icon}</span>}
                <div>
                  <span className="block text-sm font-medium text-foreground">{modelInfo?.name ?? model}</span>
                  <span className="block font-mono text-[10px] text-text-tertiary">{modelInfo?.provider}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-text-tertiary" />
            </button>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">PRESETS</label>
            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSystemPromptChange(p.prompt)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${
                    systemPrompt === p.prompt
                      ? "border-primary/40 bg-accent-subtle text-foreground"
                      : "border-border bg-surface-2 text-text-secondary hover:border-border hover:bg-surface-3"
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-wider text-text-tertiary">SYSTEM PROMPT</label>
              <Bookmark size={13} className="text-text-tertiary" />
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-md border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground placeholder:text-text-tertiary focus:border-primary/40 focus:outline-none"
              placeholder="Define the AI's behavior..."
            />
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">PARAMETERS</label>
            <Slider label="Temperature" value={params.temperature} onChange={(v) => updateParam("temperature", v)} min={0} max={2} step={0.05} />
            <Slider label="Top P" value={params.topP} onChange={(v) => updateParam("topP", v)} min={0} max={1} step={0.05} />
            <Slider label="Max Tokens" value={params.maxTokens} onChange={(v) => updateParam("maxTokens", v)} min={256} max={16384} step={256} />
          </div>
        </div>
      </aside>

      <ModelSelectorModal
        open={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        currentModel={model}
        onSelect={onModelChange}
      />
    </>
  );
}
