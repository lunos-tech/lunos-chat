import { memo, useState, useRef, useEffect } from "react";
import { Copy, Check, RotateCcw, Pencil, Trash2, ChevronDown, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ChatMessage as Msg } from "@/types/chat";
import { DEFAULT_MODELS } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Remove background from all token styles
const cleanOneDark = Object.fromEntries(
  Object.entries(oneDark).map(([key, value]) => [
    key,
    typeof value === "object" && value !== null
      ? { ...value, background: "transparent", backgroundColor: "transparent" }
      : value,
  ])
);

interface Props {
  message: Msg;
  onRegenerate?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={copy} className="rounded p-1 text-text-tertiary transition-colors hover:text-foreground">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? "Copied" : "Copy"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot [animation-delay:0.2s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot [animation-delay:0.4s]" />
    </span>
  );
}

function MetadataDropdown({ message }: { message: Msg }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = message.metadata;

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (!meta) return null;

  return (
    <div ref={ref} className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 rounded p-1 text-text-tertiary transition-colors hover:text-foreground"
          >
            <Info size={13} />
            <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Message info</p>
        </TooltipContent>
      </Tooltip>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[180px] rounded-md border border-border bg-card p-2.5 shadow-lg">
          <p className="mb-1.5 font-mono text-[10px] font-semibold tracking-wider text-text-tertiary uppercase">Metadata</p>
          <div className="space-y-1">
            {meta.tokenCount != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Tokens</span>
                <span className="font-mono text-foreground">{meta.tokenCount.toLocaleString()}</span>
              </div>
            )}
            {meta.tps != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Speed</span>
                <span className="font-mono text-foreground">{meta.tps.toFixed(1)} tok/s</span>
              </div>
            )}
            {meta.cost != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Cost</span>
                <span className="font-mono text-foreground">${meta.cost.toFixed(4)}</span>
              </div>
            )}
            {meta.duration != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Duration</span>
                <span className="font-mono text-foreground">{meta.duration.toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(function ChatMessage({ message, onRegenerate, onEdit, onDelete }: Props) {
  const isUser = message.role === "user";
  const modelInfo = message.model ? DEFAULT_MODELS.find((m) => m.id === message.model) : null;

  return (
    <div className={`group px-4 py-4 ${isUser ? "" : "bg-surface-1/40"}`}>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-1.5 flex items-center gap-2">
          <span className={`font-mono text-xs font-medium tracking-wider ${isUser ? "text-primary" : "text-text-secondary"}`}>
            {isUser ? "YOU" : modelInfo?.name ?? "AI"}
          </span>
          {modelInfo && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
              {modelInfo.provider}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed text-foreground">
          {message.isStreaming && !message.content ? (
            <TypingIndicator />
          ) : (
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeStr = String(children).replace(/\n$/, "");
                  if (match) {
                    return (
                      <div className="my-3 overflow-hidden rounded-md border border-border">
                        <div className="flex items-center justify-between bg-surface-2 px-3 py-1.5">
                          <span className="font-mono text-[11px] text-text-tertiary">{match[1]}</span>
                          <CopyButton text={codeStr} />
                        </div>
                        <SyntaxHighlighter
                          style={cleanOneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, background: "hsl(220, 13%, 7%)", fontSize: "13px", padding: "12px 16px" }}
                          codeTagProps={{ style: { background: "transparent" } }}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  return (
                    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-primary" {...props}>
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>;
                },
                h1({ children }) {
                  return <h1 className="mb-3 mt-5 text-lg font-semibold">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="mb-2 mt-4 text-base font-semibold">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="mb-2 mt-3 text-sm font-semibold">{children}</h3>;
                },
                blockquote({ children }) {
                  return <blockquote className="mb-3 border-l-2 border-primary/40 pl-3 text-text-secondary italic">{children}</blockquote>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Actions */}
        {!message.isStreaming && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <CopyButton text={message.content} />
            {!isUser && message.metadata && <MetadataDropdown message={message} />}
            {!isUser && onRegenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onRegenerate} className="rounded p-1 text-text-tertiary transition-colors hover:text-foreground">
                    <RotateCcw size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Regenerate</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isUser && onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => onEdit(message.content)} className="rounded p-1 text-text-tertiary transition-colors hover:text-foreground">
                    <Pencil size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onDelete} className="rounded p-1 text-text-tertiary transition-colors hover:text-destructive">
                    <Trash2 size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
