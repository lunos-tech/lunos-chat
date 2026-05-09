import { useState } from "react";
import { X, Bookmark, ChevronRight, ChevronDown, Code2, Wrench, Globe, ImageIcon } from "lucide-react";
import type { ModelParams, ImageConfig } from "@/types/chat";
import { DEFAULT_PRESETS } from "@/types/chat";
import CodeSnippetsModal from "./CodeSnippetsModal";
import ToolsModal, { type ToolDefinition } from "./ToolsModal";
import type { ProviderConfig } from "./ProviderModal";

interface Props {
  model: string;
  onModelChange: (m: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (p: string) => void;
  params: ModelParams;
  onParamsChange: (p: ModelParams) => void;
  open: boolean;
  onClose: () => void;
  provider?: ProviderConfig | null;
  onOpenProviderModal?: () => void;
  tools: ToolDefinition[];
  onToolsChange: (tools: ToolDefinition[]) => void;
  supportedParams?: string[] | null;
  supportsImageOutput?: boolean;
  imageConfig?: ImageConfig;
  onImageConfigChange?: (cfg: ImageConfig) => void;
}

const ASPECT_RATIO_OPTIONS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;
const IMAGE_SIZE_OPTIONS = ["1K", "2K", "4K"] as const;

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

export default function ControlPanel({ model, onModelChange, systemPrompt, onSystemPromptChange, params, onParamsChange, open, onClose, provider, onOpenProviderModal, tools, onToolsChange, supportedParams, supportsImageOutput, imageConfig, onImageConfigChange }: Props) {
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [paramsOpen, setParamsOpen] = useState(true);

  // Helper: check if a parameter is supported by the current model
  // null = no data, treat as all supported
  const supports = (param: string) => !supportedParams || supportedParams.includes(param);
  const hasAnyParam = supports("temperature") || supports("top_p") || supports("max_tokens");


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
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold tracking-wide text-foreground">CONTROLS</span>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* AI Provider */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">AI PROVIDER</label>
            <button
              onClick={onOpenProviderModal}
              className="flex w-full items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-primary" />
                <div>
                  <span className="block text-sm font-medium text-foreground">{provider?.name ?? "Not configured"}</span>
                  {provider && (
                    <span className="block font-mono text-[10px] text-text-tertiary truncate max-w-[180px]">{provider.baseUrl}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={14} className="text-text-tertiary" />
            </button>
          </div>

          {/* Presets Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">PRESET</label>
            <div className="relative">
              <select
                value={DEFAULT_PRESETS.find((p) => p.prompt === systemPrompt)?.id ?? "custom"}
                onChange={(e) => {
                  const preset = DEFAULT_PRESETS.find((p) => p.id === e.target.value);
                  if (preset) onSystemPromptChange(preset.prompt);
                }}
                className="w-full appearance-none rounded-md border border-border bg-surface-2 px-3 py-2.5 pr-8 text-sm text-foreground focus:border-primary/40 focus:outline-none"
              >
                {DEFAULT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
                {!DEFAULT_PRESETS.some((p) => p.prompt === systemPrompt) && (
                  <option value="custom" disabled>Custom</option>
                )}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
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
          <div className="space-y-2">
            <button
              onClick={() => setParamsOpen((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold tracking-wider text-text-tertiary hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                PARAMETERS
                {!hasAnyParam && supportedParams && (
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-normal text-text-tertiary">NOT SUPPORTED</span>
                )}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${paramsOpen ? "rotate-0" : "-rotate-90"}`}
              />
            </button>
            <div
              className={`space-y-4 overflow-hidden transition-all duration-200 ${paramsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
            >
              {supports("temperature") && (
                <Slider label="Temperature" value={params.temperature} onChange={(v) => updateParam("temperature", v)} min={0} max={2} step={0.05} />
              )}
              {supports("top_p") && (
                <Slider label="Top P" value={params.topP} onChange={(v) => updateParam("topP", v)} min={0} max={1} step={0.05} />
              )}
              {supports("max_tokens") && (
                <Slider label="Max Tokens" value={params.maxTokens} onChange={(v) => updateParam("maxTokens", v)} min={256} max={16384} step={256} />
              )}
              {!hasAnyParam && supportedParams && (
                <p className="text-[11px] italic text-text-tertiary">This model does not support parameter tuning.</p>
              )}
            </div>
          </div>

          {/* Image Output (only when model supports image generation) */}
          {supportsImageOutput && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-text-tertiary">
                <ImageIcon size={12} className="text-primary" />
                IMAGE OUTPUT
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">ACTIVE</span>
              </label>
              <p className="text-[11px] leading-relaxed text-text-tertiary">
                This model can generate images. The next response may include one or more images.
              </p>

              <div className="space-y-3 rounded-md border border-border bg-surface-2/60 p-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">Aspect ratio</label>
                    <span className="font-mono text-[10px] text-text-tertiary">{imageConfig?.aspect_ratio ?? "default"}</span>
                  </div>
                  <div className="relative">
                    <select
                      value={imageConfig?.aspect_ratio ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        onImageConfigChange?.({
                          ...(imageConfig ?? {}),
                          aspect_ratio: v || undefined,
                        });
                      }}
                      className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary/40 focus:outline-none"
                    >
                      <option value="">Default</option>
                      {ASPECT_RATIO_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">Image size</label>
                    <span className="font-mono text-[10px] text-text-tertiary">{imageConfig?.image_size ?? "default"}</span>
                  </div>
                  <div className="relative">
                    <select
                      value={imageConfig?.image_size ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        onImageConfigChange?.({
                          ...(imageConfig ?? {}),
                          image_size: v || undefined,
                        });
                      }}
                      className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-8 text-xs text-foreground focus:border-primary/40 focus:outline-none"
                    >
                      <option value="">Default</option>
                      {IMAGE_SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tools / Function Calling */}
          {supports("tools") && (
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-text-tertiary">TOOLS</label>
              <button
                onClick={() => setToolsOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/30"
              >
                <Wrench size={14} className="text-primary" />
                {tools.length > 0 ? `${tools.length} tool${tools.length > 1 ? "s" : ""} defined` : "Define Tools"}
                <ChevronRight size={14} className="ml-auto text-text-tertiary" />
              </button>
            </div>
          )}

          {/* Code Snippets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-text-tertiary">CODE EXAMPLE</label>
            <button
              onClick={() => setSnippetsOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/30"
            >
              <Code2 size={14} className="text-primary" />
              View API Snippets
              <ChevronRight size={14} className="ml-auto text-text-tertiary" />
            </button>
          </div>
        </div>
      </aside>

      <CodeSnippetsModal
        open={snippetsOpen}
        onClose={() => setSnippetsOpen(false)}
        model={model}
        systemPrompt={systemPrompt}
        params={params}
        baseUrl={provider?.baseUrl}
      />

      <ToolsModal
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        tools={tools}
        onToolsChange={onToolsChange}
      />
    </>
  );
}
