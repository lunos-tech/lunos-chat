import { Menu, Settings2, ChevronDown } from "lucide-react";
import { DEFAULT_MODELS } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  model: string;
  onToggleSidebar: () => void;
  onToggleControls: () => void;
  onOpenModelModal?: () => void;
}

export default function TopBar({ model, onToggleSidebar, onToggleControls, onOpenModelModal }: Props) {
  const modelInfo = DEFAULT_MODELS.find((m) => m.id === model);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onToggleSidebar} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden">
              <Menu size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle sidebar</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenModelModal}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {modelInfo && <span className="text-base leading-none">{modelInfo.icon}</span>}
              <span className="text-xs font-medium text-foreground">{modelInfo?.name ?? model}</span>
              <ChevronDown size={12} className="text-text-tertiary" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select model</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onToggleControls} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
              <Settings2 size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Control panel</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
