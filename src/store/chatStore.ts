import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatSession, ChatMessage, ModelParams, MessageMetadata, ContextWindowChats, MessageReasoningDetail, GeneratedImage } from "@/types/chat";
import { DEFAULT_PARAMS, DEFAULT_PRESETS, DEFAULT_CONTEXT_WINDOW_CHATS } from "@/types/chat";

const createId = () => crypto.randomUUID();

const SESSIONS_STORAGE_KEY = "lunos-chat-sessions";
const ACTIVE_SESSION_KEY = "lunos-active-session";

// ─── localStorage helpers ────────────────────────────────────────────

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatSession[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore corrupt data
  }
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // storage full — silently ignore
  }
}

function loadActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

function saveActiveSessionId(id: string) {
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

// ─── factory ─────────────────────────────────────────────────────────

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

// ─── hook ────────────────────────────────────────────────────────────

export function useChatStore() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded : [createSession("gpt-4o")];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const storedId = loadActiveSessionId();
    if (storedId && sessions.some((s) => s.id === storedId)) return storedId;
    return sessions[0].id;
  });

  const [params, setParams] = useState<ModelParams>(DEFAULT_PARAMS);
  const [maxContextChats, setMaxContextChats] = useState<ContextWindowChats>(DEFAULT_CONTEXT_WINDOW_CHATS);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024; // Open on desktop by default
    }
    return true;
  });
  const [controlPanelOpen, setControlPanelOpen] = useState(false);

  // Persist sessions to localStorage whenever they change
  // Use a ref so the effect doesn't fire on mount with default data
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveSessions(sessions);
  }, [sessions]);

  // Persist active session id
  useEffect(() => {
    saveActiveSessionId(activeSessionId);
  }, [activeSessionId]);

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
      }));
      return message;
    },
    [activeSessionId, updateSession]
  );

  const updateSessionTitle = useCallback(
    (title: string) => {
      updateSession(activeSessionId, (s) => ({
        ...s,
        title,
        updatedAt: Date.now(),
      }));
    },
    [activeSessionId, updateSession]
  );

  const updateLastAssistantMessage = useCallback(
    (
      content: string,
      isStreaming: boolean,
      metadata?: MessageMetadata,
      reasoning?: string,
      reasoningDetails?: MessageReasoningDetail[],
      generatedImages?: GeneratedImage[]
    ) => {
      updateSession(activeSessionId, (s) => {
        const msgs = [...s.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content,
            isStreaming,
            ...(metadata ? { metadata } : {}),
            ...(reasoning !== undefined ? { reasoning } : {}),
            ...(reasoningDetails !== undefined ? { reasoningDetails } : {}),
            ...(generatedImages !== undefined ? { generatedImages } : {}),
          };
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
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
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

  const truncateMessages = useCallback(
    (messageId: string) => {
      updateSession(activeSessionId, (s) => {
        const idx = s.messages.findIndex((m) => m.id === messageId);
        if (idx === -1) return s;
        return {
          ...s,
          messages: s.messages.slice(0, idx),
          updatedAt: Date.now(),
        };
      });
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
    maxContextChats,
    setMaxContextChats,
    sidebarOpen,
    setSidebarOpen,
    controlPanelOpen,
    setControlPanelOpen,
    addMessage,
    updateSessionTitle,
    updateLastAssistantMessage,
    setSystemPrompt,
    setModel,
    newChat,
    deleteSession,
    deleteMessage,
    truncateMessages,
  };
}
