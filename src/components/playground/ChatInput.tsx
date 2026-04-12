import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square, Paperclip, Globe, ImagePlus, Mic, History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTEXT_WINDOW_CHAT_OPTIONS,
  DEFAULT_CONTEXT_WINDOW_CHATS,
  type ContextWindowChats,
} from "@/types/chat";

interface Props {
  onSend: (msg: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  maxContextChats: ContextWindowChats;
  onMaxContextChatsChange: (v: ContextWindowChats) => void;
}

function contextChatsToSelectValue(v: ContextWindowChats) {
  return v === "all" ? "all" : String(v);
}

function selectValueToContextChats(s: string): ContextWindowChats {
  if (s === "all") return "all";
  const n = Number(s);
  return (CONTEXT_WINDOW_CHAT_OPTIONS as readonly number[]).includes(n)
    ? (n as ContextWindowChats)
    : DEFAULT_CONTEXT_WINDOW_CHATS;
}

function contextChatsTooltipSummary(v: ContextWindowChats) {
  return v === "all" ? "All messages" : `Last ${v} messages`;
}

function IconButton({ icon: Icon, label, onClick }: { icon: typeof Paperclip; label: string; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <Icon size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  maxContextChats,
  onMaxContextChatsChange,
}: Props) {
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
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              <IconButton icon={Paperclip} label="Attach file" />
              <IconButton icon={ImagePlus} label="Upload image" />
              <IconButton icon={Globe} label="Search the web" />
              <IconButton icon={Mic} label="Voice input" />
              <Select
                value={contextChatsToSelectValue(maxContextChats)}
                onValueChange={(s) => onMaxContextChatsChange(selectValueToContextChats(s))}
                disabled={disabled}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger
                      aria-label={`Window context: ${contextChatsTooltipSummary(maxContextChats)}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-text-tertiary shadow-none hover:bg-surface-2 hover:text-foreground focus:ring-0 focus:ring-offset-0 disabled:opacity-50 [&>svg:last-child]:hidden"
                    >
                      <History size={16} strokeWidth={1.75} className="shrink-0" />
                      <span className="sr-only">
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">{contextChatsTooltipSummary(maxContextChats)}</p>
                    <p className="mt-1 text-text-secondary">
                      How many recent messages are sent to the model; older ones are dropped first.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-normal text-text-tertiary">Context window</SelectLabel>
                    {CONTEXT_WINDOW_CHAT_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} msgs
                      </SelectItem>
                    ))}
                    <SelectItem value="all">All</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                <p>{isStreaming ? "Stop generation" : "Send message"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
