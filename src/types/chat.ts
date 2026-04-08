export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  model?: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  systemPrompt: string;
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsImages: boolean;
}

export interface ModelParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface PromptPreset {
  id: string;
  name: string;
  prompt: string;
  icon?: string;
}

export const DEFAULT_MODELS: ModelConfig[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "Most capable, multimodal", maxTokens: 128000, supportsStreaming: true, supportsImages: true },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", description: "Fast and efficient", maxTokens: 128000, supportsStreaming: true, supportsImages: true },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", description: "Balanced performance", maxTokens: 200000, supportsStreaming: true, supportsImages: true },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", description: "Highest capability", maxTokens: 200000, supportsStreaming: true, supportsImages: true },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google", description: "Versatile and fast", maxTokens: 1000000, supportsStreaming: true, supportsImages: true },
  { id: "llama-3.1-70b", name: "Llama 3.1 70B", provider: "Meta", description: "Open source powerhouse", maxTokens: 128000, supportsStreaming: true, supportsImages: false },
];

export const DEFAULT_PARAMS: ModelParams = {
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export const DEFAULT_PRESETS: PromptPreset[] = [
  { id: "default", name: "Default", prompt: "You are a helpful AI assistant.", icon: "💬" },
  { id: "coder", name: "Code Expert", prompt: "You are an expert software engineer. Write clean, efficient, well-documented code. Explain your reasoning when asked.", icon: "🛠" },
  { id: "writer", name: "Writer", prompt: "You are a skilled writer. Produce clear, engaging, well-structured prose. Adapt your tone to the context.", icon: "✍️" },
  { id: "analyst", name: "Data Analyst", prompt: "You are a data analyst. Provide structured analysis with clear methodology. Use tables and metrics when relevant.", icon: "📊" },
  { id: "tutor", name: "Tutor", prompt: "You are a patient, thorough tutor. Break down complex topics step by step. Check understanding before moving forward.", icon: "🎓" },
];
