import { useCallback, useRef, useState, useEffect } from "react";
import type { ChatSession, ChatMessage, ModelParams, MessageMetadata, ContextWindowChats, Attachment } from "@/types/chat";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import ControlPanel from "./ControlPanel";
import TopBar from "./TopBar";
import ProviderModal, { isProviderConfigured, getStoredProvider, type ProviderConfig } from "./ProviderModal";
import ModelSelectorModal, { getModelSupportedParams } from "./ModelSelectorModal";
import WelcomeModal from "./WelcomeModal";
import { type ToolDefinition } from "./ToolsModal";
import { streamChat, summarizeTitle } from "@/lib/chatService";

export default function PlaygroundLayout() {
  const store = useChatStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [provider, setProvider] = useState<ProviderConfig | null>(getStoredProvider);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const navigate = useNavigate();
  const { id } = useParams();

  // 1. Sync Store -> URL
  // Triggered only when the store's active session changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!id || (store.activeSessionId && id !== store.activeSessionId)) {
      navigate(`/chat/${store.activeSessionId}`, { replace: !id });
    }
  }, [store.activeSessionId]);

  // 2. Sync URL -> Store
  // Triggered only when the URL's id parameter changes (e.g. browser back button).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (id && id !== store.activeSessionId) {
      const exists = store.sessions.some((s) => s.id === id);
      if (exists) {
        store.setActiveSessionId(id);
      } else {
        // ID not found (invalid URL): revert the URL back to our active session
        navigate(`/chat/${store.activeSessionId}`, { replace: true });
      }
    }
  }, [id]);

  // Look up supported parameters for the current model
  const supportedParams = getModelSupportedParams(store.activeSession.model);

  // Show welcome modal or provider modal on first load
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("lunos_welcomed");
    if (!hasSeenWelcome) {
      setWelcomeOpen(true);
    } else if (!isProviderConfigured()) {
      setProviderModalOpen(true);
    }
  }, []);

  const handleWelcomeClose = useCallback(() => {
    localStorage.setItem("lunos_welcomed", "true");
    setWelcomeOpen(false);
    if (!isProviderConfigured()) {
      // Small delay for smooth transition
      setTimeout(() => setProviderModalOpen(true), 300);
    }
  }, []);

  const runStream = useCallback(
    (userContent?: string, existingMessages?: typeof store.activeSession.messages, attachments?: Attachment[], webSearch?: boolean) => {
      const currentProvider = getStoredProvider();
      if (!currentProvider) {
        toast.error("Please configure your AI provider first");
        setProviderModalOpen(true);
        return;
      }

      const currentMessages = existingMessages ?? store.activeSession.messages;
      const isFirstMessage = currentMessages.length === 0 && !!userContent;

      // Add user message first
      if (userContent || (attachments && attachments.length > 0)) {
        store.addMessage({
          role: "user",
          content: userContent || "",
          model: store.activeSession.model,
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
        });
      }

      // Add empty assistant message placeholder
      store.addMessage({ role: "assistant", content: "", model: store.activeSession.model, isStreaming: true });
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const startTime = Date.now();

      // If this is the first message, summarize it as the title concurrently
      if (isFirstMessage && userContent) {
        summarizeTitle(currentProvider, store.activeSession.model, userContent)
          .then((title) => {
            store.updateSessionTitle(title);
          })
          .catch(() => {
            // Fallback handled inside summarizeTitle already
          });
      }

      // Build messages snapshot for the API call
      const messagesForApi: ChatMessage[] = [
        ...currentMessages,
        ...((userContent || (attachments && attachments.length > 0))
          ? [{
              id: "",
              role: "user" as const,
              content: userContent || "",
              model: store.activeSession.model,
              timestamp: Date.now(),
              attachments: attachments && attachments.length > 0 ? attachments : undefined,
            }]
          : []),
      ];

      let accumulated = "";
      let accumulatedReasoning = "";

      const cleanup = streamChat(
        currentProvider,
        store.activeSession.model,
        store.activeSession.systemPrompt,
        messagesForApi,
        store.maxContextChats,
        store.params,
        tools,
        webSearch ?? false,
        {
          onDelta: (delta) => {
            accumulated += delta;
            store.updateLastAssistantMessage(accumulated, true, undefined, accumulatedReasoning);
          },
          onReasoningDelta: (delta) => {
            accumulatedReasoning += delta;
            store.updateLastAssistantMessage(accumulated, true, undefined, accumulatedReasoning);
          },
          onDone: (result) => {
            const duration = (Date.now() - startTime) / 1000;
            const tokenCount = Math.round((result.content.length + result.reasoning.length) / 4);
            const tps = duration > 0 ? tokenCount / duration : 0;
            store.updateLastAssistantMessage(
              result.content,
              false,
              {
                tokenCount,
                tps,
                duration,
              },
              result.reasoning,
              result.reasoningDetails
            );
            setIsStreaming(false);
            abortRef.current = null;
            cleanupRef.current = null;
          },
          onError: (errorMsg) => {
            store.updateLastAssistantMessage(
              `⚠️ **Error:** ${errorMsg}`,
              false,
            );
            setIsStreaming(false);
            abortRef.current = null;
            cleanupRef.current = null;
            toast.error("Failed to get response", { description: errorMsg });
          },
        },
        controller.signal,
        supportedParams,
      );

      cleanupRef.current = cleanup;
    },
    [store, tools]
  );

  const handleSend = useCallback(
    (content: string, attachments: Attachment[], webSearch: boolean) => {
      if (!isProviderConfigured()) {
        toast.error("Please configure your AI provider first");
        setProviderModalOpen(true);
        return;
      }
      runStream(content, undefined, attachments, webSearch);
    },
    [runStream]
  );

  const handleRegenerate = useCallback(
    (messageId: string) => {
      // Build clean messages without the one being regenerated BEFORE deleting
      const cleanedMessages = store.activeSession.messages.filter((m) => m.id !== messageId);
      // Delete from store (UI update)
      store.deleteMessage(messageId);
      // Pass the already-filtered messages to avoid stale state
      runStream(undefined, cleanedMessages);
    },
    [store, runStream]
  );

  const handleEdit = useCallback(
    (messageId: string, newContent: string) => {
      const msgs = store.activeSession.messages;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) return;

      const cleanedMessages = msgs.slice(0, idx);
      store.truncateMessages(messageId);
      runStream(newContent, cleanedMessages);
    },
    [store, runStream]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    cleanupRef.current?.();
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
          sidebarOpen={store.sidebarOpen}
          model={store.activeSession.model}
          onToggleSidebar={() => store.setSidebarOpen(!store.sidebarOpen)}
          onToggleControls={() => store.setControlPanelOpen(!store.controlPanelOpen)}
          onOpenModelModal={() => setModelModalOpen(true)}
        />
        <ChatArea
          session={store.activeSession}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          onDeleteMessage={store.deleteMessage}
          onRegenerate={handleRegenerate}
          onEditMessage={handleEdit}
          maxContextChats={store.maxContextChats}
          onMaxContextChatsChange={store.setMaxContextChats}
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
        tools={tools}
        onToolsChange={setTools}
        supportedParams={supportedParams}
      />

      <ProviderModal
        open={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        onSave={setProvider}
      />

      <ModelSelectorModal
        open={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        currentModel={store.activeSession.model}
        onSelect={store.setModel}
      />

      <WelcomeModal
        open={welcomeOpen}
        onClose={handleWelcomeClose}
      />
    </div>
  );
}
