import { Menu, Settings2, Zap } from "lucide-react";
import { DEFAULT_MODELS } from "@/types/chat";

interface Props {
  model: string;
  onToggleSidebar: () => void;
  onToggleControls: () => void;
}

export default function TopBar({ model, onToggleSidebar, onToggleControls }: Props) {
  const modelInfo = DEFAULT_MODELS.find((m) => m.id === model);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3">
      <div className="flex items-center gap-2">
        <button onClick={onToggleSidebar} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden">
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Lunos</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {modelInfo && (
          <div className="hidden items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-xs text-text-secondary">{modelInfo.name}</span>
          </div>
        )}
        <button onClick={onToggleControls} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
          <Settings2 size={18} />
        </button>
      </div>
    </header>
  );
}
