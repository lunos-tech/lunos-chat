import { memo, useState } from "react";
import { Copy, Check, RotateCcw, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ChatMessage as Msg } from "@/types/chat";
import { DEFAULT_MODELS } from "@/types/chat";

interface Props {
  message: Msg;
  onRegenerate?: () => void;
  onEdit?: (content: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="rounded p-1 text-text-tertiary transition-colors hover:text-foreground">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
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

export default memo(function ChatMessage({ message, onRegenerate, onEdit }: Props) {
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
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, background: "hsl(220, 13%, 7%)", fontSize: "13px", padding: "12px 16px" }}
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
            {!isUser && onRegenerate && (
              <button onClick={onRegenerate} className="rounded p-1 text-text-tertiary transition-colors hover:text-foreground" title="Regenerate">
                <RotateCcw size={13} />
              </button>
            )}
            {isUser && onEdit && (
              <button onClick={() => onEdit(message.content)} className="rounded p-1 text-text-tertiary transition-colors hover:text-foreground" title="Edit">
                <Pencil size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
