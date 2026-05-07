import { useRef, useEffect, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { ChatSession, ContextWindowChats, Attachment } from "@/types/chat";

interface Props {
  session: ChatSession;
  onSend: (msg: string, attachments: Attachment[], webSearch: boolean) => void;
  onStop?: () => void;
  isStreaming: boolean;
  onDeleteMessage?: (id: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEditMessage?: (id: string, content: string) => void;
  maxContextChats: ContextWindowChats;
  onMaxContextChatsChange: (v: ContextWindowChats) => void;
}

function EmptyState({ model }: { model: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="mb-5 flex items-center justify-center">
        <img src="/logo.png" alt="Lunos Logo" className="h-16 w-16 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
      </div>
      <h2 className="mb-1 text-lg font-semibold text-foreground">Lunos Playground</h2>
      <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
        Start a conversation. Adjust model, parameters, and system prompt from the control panel.
      </p>
      <div className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="font-mono text-xs text-text-secondary">{model}</span>
      </div>
    </div>
  );
}

export default function ChatArea({
  session,
  onSend,
  onStop,
  isStreaming,
  onDeleteMessage,
  onRegenerate,
  onEditMessage,
  maxContextChats,
  onMaxContextChatsChange,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!userScrolledUp.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Scroll on new messages and streaming content updates
  useEffect(() => {
    scrollToBottom();
  }, [session.messages, session.messages[session.messages.length - 1]?.content, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolledUp.current = !atBottom;
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
        {session.messages.length === 0 ? (
          <div className="flex h-full flex-col">
            <EmptyState model={session.model} />
          </div>
        ) : (
          <div className="pb-4">
            {session.messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onDelete={onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
                onRegenerate={msg.role === "assistant" && onRegenerate ? () => onRegenerate(msg.id) : undefined}
                onEdit={msg.role === "user" && onEditMessage ? (content) => onEditMessage(msg.id, content) : undefined}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        maxContextChats={maxContextChats}
        onMaxContextChatsChange={onMaxContextChatsChange}
      />
    </div>
  );
}
