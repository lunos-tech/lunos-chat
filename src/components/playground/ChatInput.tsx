import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square, Paperclip, Globe, ImagePlus, Mic } from "lucide-react";

interface Props {
  onSend: (msg: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

function IconButton({ icon: Icon, label, onClick }: { icon: typeof Paperclip; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <Icon size={16} />
    </button>
  );
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
        <div className="rounded-lg border border-border bg-surface-1 transition-colors focus-within:border-primary/40">
          {/* Textarea */}
          <div className="px-3 pt-2.5 pb-1">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              rows={1}
              disabled={disabled}
              className="max-h-[200px] min-h-[24px] w-full resize-none bg-transparent text-sm text-foreground placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-0.5">
              <IconButton icon={Paperclip} label="Attach file" />
              <IconButton icon={ImagePlus} label="Upload image" />
              <IconButton icon={Globe} label="Search the web" />
              <IconButton icon={Mic} label="Voice input" />
            </div>

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
        </div>
      </div>
    </div>
  );
}
