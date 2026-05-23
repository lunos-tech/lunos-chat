import { Shield, Zap, LayoutPanelLeft, Check, KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex flex-col items-center border-b border-border bg-surface-2 px-6 py-8 text-center relative">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Welcome to Lunos Playground</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A flexible, developer-first environment to test and run your favorite AI models.
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Complete Control</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tweak system prompts, manage tools, and adjust precise model parameters directly from the sidebar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutPanelLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Multiple Sessions</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Keep multiple chats running in parallel. Freely switch contexts without losing your train of thought.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Secure & Private</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground font-medium">No tracking. No accounts.</strong> Your API keys are RSA-encrypted before storage — never saved in plain text. Chat history and settings stay in your browser. You own your data.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Multi-Provider Ready</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Configure multiple AI providers at once. Switch between OpenAI, Anthropic, Google, and more without re-entering your keys.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-surface-2 px-6 py-4">
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Check size={16} /> Look Good, Let's Go
          </button>
        </div>
      </div>
    </div>
  );
}
