import { useCallback, useRef, useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import ControlPanel from "./ControlPanel";
import TopBar from "./TopBar";
import ProviderModal, { isProviderConfigured, getStoredProvider, type ProviderConfig } from "./ProviderModal";

// Simulated streaming response
function simulateStream(onDelta: (t: string) => void, onDone: () => void, signal: AbortSignal) {
  const response = `Here's a demonstration of the Lunos Playground capabilities.

## Features

- **Multi-model support**: Switch between GPT-4o, Claude, Gemini, and more
- **System prompt control**: Deep customization of AI behavior
- **Parameter tuning**: Temperature, top_p, frequency penalty, and more

\`\`\`typescript
// Example: streaming API call
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({ messages, model, params }),
});

const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  yield decoder.decode(value);
}
\`\`\`

> The playground is designed for developers who need precise control over their AI interactions.

This is a **local demo**. Connect to a real API to unlock full functionality.`;

  const words = response.split(/(?<=\s)/);
  let i = 0;
  const interval = setInterval(() => {
    if (signal.aborted || i >= words.length) {
      clearInterval(interval);
      onDone();
      return;
    }
    onDelta(words[i]);
    i++;
  }, 25);

  return () => clearInterval(interval);
}

export default function PlaygroundLayout() {
  const store = useChatStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [provider, setProvider] = useState<ProviderConfig | null>(getStoredProvider);

  // Show provider modal on first use
  useEffect(() => {
    if (!isProviderConfigured()) {
      setProviderModalOpen(true);
    }
  }, []);

  const runStream = useCallback(
    (userContent?: string) => {
      if (userContent) {
        store.addMessage({ role: "user", content: userContent, model: store.activeSession.model });
      }

      store.addMessage({ role: "assistant", content: "", model: store.activeSession.model, isStreaming: true });
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const startTime = Date.now();

      let accumulated = "";
      simulateStream(
        (delta) => {
          accumulated += delta;
          store.updateLastAssistantMessage(accumulated, true);
        },
        () => {
          const duration = (Date.now() - startTime) / 1000;
          const tokenCount = Math.round(accumulated.length / 4);
          const tps = tokenCount / duration;
          const cost = tokenCount * 0.00001;
          store.updateLastAssistantMessage(accumulated, false, {
            tokenCount,
            tps,
            cost,
            duration,
          });
          setIsStreaming(false);
          abortRef.current = null;
        },
        controller.signal
      );
    },
    [store]
  );

  const handleSend = useCallback(
    (content: string) => {
      runStream(content);
    },
    [runStream]
  );

  const handleRegenerate = useCallback(
    (messageId: string) => {
      // Delete the message being regenerated
      store.deleteMessage(messageId);
      // Run a new stream (no user message added)
      runStream();
    },
    [store, runStream]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return (
    <div className="flex h-dvh w-full bg-background">
      <ChatSidebar
        sessions={store.sessions}
        activeId={store.activeSessionId}
        onSelect={store.setActiveSessionId}
        onNew={store.newChat}
        onDelete={store.deleteSession}
        open={store.sidebarOpen}
        onClose={() => store.setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          model={store.activeSession.model}
          onToggleSidebar={() => store.setSidebarOpen(!store.sidebarOpen)}
          onToggleControls={() => store.setControlPanelOpen(!store.controlPanelOpen)}
        />
        <ChatArea
          session={store.activeSession}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          onDeleteMessage={store.deleteMessage}
          onRegenerate={handleRegenerate}
        />
      </div>

      <ControlPanel
        model={store.activeSession.model}
        onModelChange={store.setModel}
        systemPrompt={store.activeSession.systemPrompt}
        onSystemPromptChange={store.setSystemPrompt}
        params={store.params}
        onParamsChange={store.setParams}
        open={store.controlPanelOpen}
        onClose={() => store.setControlPanelOpen(false)}
        provider={provider}
        onOpenProviderModal={() => setProviderModalOpen(true)}
      />

      <ProviderModal
        open={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        onSave={setProvider}
      />
    </div>
  );
}
