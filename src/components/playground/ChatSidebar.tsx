import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { Plus, X, Trash2, Globe, Github, Moon, Sun } from "lucide-react";
import type { ChatSession } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleColorMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const groupedSessions = useMemo(() => {
    const groups: { label: string; items: ChatSession[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    sessions.forEach((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      
      let label = "";
      if (d.getTime() === today.getTime()) {
        label = "Today";
      } else if (d.getTime() === yesterday.getTime()) {
        label = "Yesterday";
      } else {
        label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      }

      let group = groups.find((g) => g.label === label);
      if (!group) {
        group = { label, items: [] };
        groups.push(group);
      }
      group.items.push(s);
    });
    
    return groups;
  }, [sessions]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out lg:relative lg:z-auto ${
          open ? "translate-x-0 lg:ml-0" : "-translate-x-full lg:-ml-72"
        }`}
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <img src="/logo.png" alt="Lunos" className="h-5 w-5 rounded" />
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleColorMode}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Toggle color theme"
                >
                  {!mounted ? (
                    <Sun size={16} className="opacity-0" aria-hidden />
                  ) : resolvedTheme === "dark" ? (
                    <Sun size={16} aria-hidden />
                  ) : (
                    <Moon size={16} aria-hidden />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={onNew} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                  <Plus size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New chat</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden">
                  <X size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close sidebar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2">
          {groupedSessions.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <div className="mb-1 px-3 py-1">
                <span className="text-[10px] font-bold tracking-wider text-text-tertiary uppercase">{group.label}</span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { 
                      onSelect(s.id); 
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        onClose(); 
                      }
                    }}
                    className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      s.id === activeId
                        ? "bg-surface-2 text-foreground"
                        : "text-text-secondary hover:bg-surface-2/50 hover:text-foreground"
                    }`}
                  >
                    <span className="flex-1 truncate">{s.title}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                          className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete chat</p>
                      </TooltipContent>
                    </Tooltip>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <a href="https://lunos.tech" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-text-tertiary hover:text-primary transition-colors">lunos.tech</a>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href="https://lunos.tech" target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                    <Globe size={14} />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Website</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href="https://github.com/superXdev/lunos" target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                    <Github size={14} />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>GitHub</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
