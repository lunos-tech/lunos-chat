import { useState, useCallback } from "react";
import type { ChatSession, ChatMessage, ModelParams } from "@/types/chat";
import { DEFAULT_PARAMS, DEFAULT_PRESETS } from "@/types/chat";

const createId = () => crypto.randomUUID();

function createSession(model: string): ChatSession {
  return {
    id: createId(),
    title: "New chat",
    messages: [],
    systemPrompt: DEFAULT_PRESETS[0].prompt,
    model,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useChatStore() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createSession("gpt-4o")]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0].id);
  const [params, setParams] = useState<ModelParams>(DEFAULT_PARAMS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  const updateSession = useCallback(
    (id: string, updater: (s: ChatSession) => ChatSession) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
    },
    []
  );

  const addMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">) => {
      const message: ChatMessage = { ...msg, id: createId(), timestamp: Date.now() };
      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: [...s.messages, message],
        updatedAt: Date.now(),
        title: s.messages.length === 0 && msg.role === "user" ? msg.content.slice(0, 40) : s.title,
      }));
      return message;
    },
    [activeSessionId, updateSession]
  );

  const updateLastAssistantMessage = useCallback(
    (content: string, isStreaming: boolean) => {
      updateSession(activeSessionId, (s) => {
        const msgs = [...s.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
          msgs[lastIdx] = { ...msgs[lastIdx], content, isStreaming };
        }
        return { ...s, messages: msgs, updatedAt: Date.now() };
      });
    },
    [activeSessionId, updateSession]
  );

  const setSystemPrompt = useCallback(
    (prompt: string) => {
      updateSession(activeSessionId, (s) => ({ ...s, systemPrompt: prompt, updatedAt: Date.now() }));
    },
    [activeSessionId, updateSession]
  );

  const setModel = useCallback(
    (model: string) => {
      updateSession(activeSessionId, (s) => ({ ...s, model, updatedAt: Date.now() }));
    },
    [activeSessionId, updateSession]
  );

  const newChat = useCallback(() => {
    const session = createSession(activeSession.model);
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setSidebarOpen(false);
  }, [activeSession.model]);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const fresh = createSession("gpt-4o");
          setActiveSessionId(fresh.id);
          return [fresh];
        }
        if (id === activeSessionId) setActiveSessionId(next[0].id);
        return next;
      });
    },
    [activeSessionId]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      updateSession(activeSessionId, (s) => ({
        ...s,
        messages: s.messages.filter((m) => m.id !== messageId),
        updatedAt: Date.now(),
      }));
    },
    [activeSessionId, updateSession]
  );

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    params,
    setParams,
    sidebarOpen,
    setSidebarOpen,
    controlPanelOpen,
    setControlPanelOpen,
    addMessage,
    updateLastAssistantMessage,
    setSystemPrompt,
    setModel,
    newChat,
    deleteSession,
    deleteMessage,
  };
}
