import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";

interface Props {
  onSend: (msg: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 pb-4 pt-3">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2 transition-colors focus-within:border-primary/40">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            rows={1}
            disabled={disabled}
            className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/80"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim() || disabled}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>
        <p className="mt-2 text-center font-mono text-[11px] text-text-tertiary">
          Lunos may produce inaccurate information. Verify important outputs.
        </p>
      </div>
    </div>
  );
}
