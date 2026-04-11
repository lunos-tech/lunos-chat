import { useState } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp, Code2 } from "lucide-react";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: ToolParam[];
}

export interface ToolParam {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
}

const PARAM_TYPES = ["string", "number", "boolean", "array", "object"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  tools: ToolDefinition[];
  onToolsChange: (tools: ToolDefinition[]) => void;
}

function createTool(): ToolDefinition {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    parameters: [],
  };
}

function createParam(): ToolParam {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
    required: false,
  };
}

function ToolEditor({
  tool,
  onChange,
  onDelete,
}: {
  tool: ToolDefinition;
  onChange: (t: ToolDefinition) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateParam = (paramId: string, updates: Partial<ToolParam>) => {
    onChange({
      ...tool,
      parameters: tool.parameters.map((p) =>
        p.id === paramId ? { ...p, ...updates } : p
      ),
    });
  };

  return (
    <div className="rounded-md border border-border bg-background">
      {/* Tool Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <span className="flex-1 truncate text-xs font-medium text-foreground">
          {tool.name || "Untitled Tool"}
        </span>
        <button onClick={onDelete} className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
          <Trash2 size={13} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-wider text-muted-foreground">FUNCTION NAME</label>
            <input
              value={tool.name}
              onChange={(e) => onChange({ ...tool, name: e.target.value })}
              placeholder="get_weather"
              className="w-full rounded border border-border bg-secondary px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-wider text-muted-foreground">DESCRIPTION</label>
            <input
              value={tool.description}
              onChange={(e) => onChange({ ...tool, description: e.target.value })}
              placeholder="Retrieve current weather for a location"
              className="w-full rounded border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
            />
          </div>

          {/* Parameters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold tracking-wider text-muted-foreground">PARAMETERS</label>
              <button
                onClick={() => onChange({ ...tool, parameters: [...tool.parameters, createParam()] })}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Plus size={10} /> Add
              </button>
            </div>

            {tool.parameters.length === 0 && (
              <p className="text-[10px] italic text-muted-foreground">No parameters defined</p>
            )}

            {tool.parameters.map((param) => (
              <div key={param.id} className="flex items-start gap-1.5 rounded border border-border/50 bg-secondary/50 p-2">
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      value={param.name}
                      onChange={(e) => updateParam(param.id, { name: e.target.value })}
                      placeholder="name"
                      className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => updateParam(param.id, { type: e.target.value as ToolParam["type"] })}
                      className="rounded border border-border bg-background px-1.5 py-1 text-[11px] text-foreground focus:border-primary/40 focus:outline-none"
                    >
                      {PARAM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={param.description}
                    onChange={(e) => updateParam(param.id, { description: e.target.value })}
                    placeholder="Parameter description"
                    className="w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
                  />
                  <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={param.required}
                      onChange={(e) => updateParam(param.id, { required: e.target.checked })}
                      className="accent-primary"
                    />
                    Required
                  </label>
                </div>
                <button
                  onClick={() => onChange({ ...tool, parameters: tool.parameters.filter((p) => p.id !== param.id) })}
                  className="mt-1 rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ToolsModal({ open, onClose, tools, onToolsChange }: Props) {
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonError, setJsonError] = useState("");

  const handleImportJSON = () => {
    try {
      const raw = JSON.parse(jsonInput);
      const items = Array.isArray(raw) ? raw : [raw];

      const imported: ToolDefinition[] = items.map((item: any) => {
        // Support OpenAI function-calling format: { type: "function", function: { ... } }
        const fn = item.function ?? item;
        const params = fn.parameters?.properties ?? {};
        const required: string[] = fn.parameters?.required ?? [];

        return {
          id: crypto.randomUUID(),
          name: fn.name ?? "",
          description: fn.description ?? "",
          parameters: Object.entries(params).map(([key, val]: [string, any]) => ({
            id: crypto.randomUUID(),
            name: key,
            type: (val.type ?? "string") as ToolParam["type"],
            description: val.description ?? "",
            required: required.includes(key),
          })),
        };
      });

      onToolsChange([...tools, ...imported]);
      setJsonInput("");
      setShowJsonInput(false);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON. Please check the format and try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-lg flex-col rounded-lg border border-border bg-card shadow-2xl max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-foreground">TOOL DEFINITIONS</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Define functions the model can call</p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tools.length === 0 && !showJsonInput && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-muted-foreground">No tools defined yet</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">Add a tool to enable function calling</p>
            </div>
          )}
          {tools.map((tool) => (
            <ToolEditor
              key={tool.id}
              tool={tool}
              onChange={(updated) => onToolsChange(tools.map((t) => (t.id === updated.id ? updated : t)))}
              onDelete={() => onToolsChange(tools.filter((t) => t.id !== tool.id))}
            />
          ))}

          {/* JSON Input Area */}
          {showJsonInput && (
            <div className="space-y-2 rounded-md border border-border bg-background p-3">
              <label className="text-[10px] font-semibold tracking-wider text-muted-foreground">PASTE JSON</label>
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); }}
                rows={8}
                placeholder={`[\n  {\n    "name": "get_weather",\n    "description": "Get current weather",\n    "parameters": {\n      "properties": {\n        "location": { "type": "string", "description": "City name" }\n      },\n      "required": ["location"]\n    }\n  }\n]`}
                className="w-full resize-none rounded border border-border bg-secondary px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none"
              />
              {jsonError && (
                <p className="text-[10px] text-destructive">{jsonError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleImportJSON}
                  disabled={!jsonInput.trim()}
                  className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Import
                </button>
                <button
                  onClick={() => { setShowJsonInput(false); setJsonInput(""); setJsonError(""); }}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => onToolsChange([...tools, createTool()])}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Plus size={13} /> Add Tool
            </button>
            <button
              onClick={() => setShowJsonInput(!showJsonInput)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border border-dashed py-2 text-xs font-medium transition-colors ${
                showJsonInput
                  ? "border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
              }`}
            >
              <Code2 size={13} /> Import JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
