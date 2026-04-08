import { useCallback, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import ControlPanel from "./ControlPanel";
import TopBar from "./TopBar";

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

  const handleSend = useCallback(
    (content: string) => {
      store.addMessage({ role: "user", content, model: store.activeSession.model });

      // Add empty assistant message
      store.addMessage({ role: "assistant", content: "", model: store.activeSession.model, isStreaming: true });
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = "";
      simulateStream(
        (delta) => {
          accumulated += delta;
          store.updateLastAssistantMessage(accumulated, true);
        },
        () => {
          store.updateLastAssistantMessage(accumulated, false);
          setIsStreaming(false);
          abortRef.current = null;
        },
        controller.signal
      );
    },
    [store]
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
      />
    </div>
  );
}
