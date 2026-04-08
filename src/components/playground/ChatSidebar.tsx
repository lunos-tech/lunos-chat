import { Plus, X, Trash2, MessageSquare } from "lucide-react";
import type { ChatSession } from "@/types/chat";

interface Props {
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ sessions, activeId, onSelect, onNew, onDelete, open, onClose }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-out lg:relative lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold tracking-wide text-foreground">CHATS</span>
          <div className="flex gap-1">
            <button onClick={onNew} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground" title="New chat">
              <Plus size={16} />
            </button>
            <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { onSelect(s.id); onClose(); }}
              className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                s.id === activeId
                  ? "bg-surface-2 text-foreground"
                  : "text-text-secondary hover:bg-surface-2/50 hover:text-foreground"
              }`}
            >
              <MessageSquare size={14} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-mono text-xs text-text-tertiary">Lunos v0.1</span>
          </div>
        </div>
      </aside>
    </>
  );
}
