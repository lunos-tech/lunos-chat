export type MessageRole = "user" | "assistant" | "system";

export interface MessageMetadata {
  tokenCount?: number;
  tps?: number;
  cost?: number;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  model?: string;
  timestamp: number;
  isStreaming?: boolean;
  metadata?: MessageMetadata;
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
  maxTokens: number;
  supportsStreaming: boolean;
  supportsImages: boolean;
  icon: string;
  inputPrice: number;
  outputPrice: number;
  avgTps: number;
}

export interface ModelParams {
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface PromptPreset {
  id: string;
  name: string;
  prompt: string;
  icon?: string;
}

export const DEFAULT_MODELS: ModelConfig[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", maxTokens: 128000, supportsStreaming: true, supportsImages: true, icon: "🟢", inputPrice: 2.50, outputPrice: 10.00, avgTps: 95 },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", maxTokens: 128000, supportsStreaming: true, supportsImages: true, icon: "🟢", inputPrice: 0.15, outputPrice: 0.60, avgTps: 140 },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", maxTokens: 200000, supportsStreaming: true, supportsImages: true, icon: "🟠", inputPrice: 3.00, outputPrice: 15.00, avgTps: 82 },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", maxTokens: 200000, supportsStreaming: true, supportsImages: true, icon: "🟠", inputPrice: 15.00, outputPrice: 75.00, avgTps: 40 },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google", maxTokens: 1000000, supportsStreaming: true, supportsImages: true, icon: "🔵", inputPrice: 1.25, outputPrice: 5.00, avgTps: 110 },
  { id: "llama-3.1-70b", name: "Llama 3.1 70B", provider: "Meta", maxTokens: 128000, supportsStreaming: true, supportsImages: false, icon: "🟣", inputPrice: 0.59, outputPrice: 0.79, avgTps: 70 },
];

export const DEFAULT_PARAMS: ModelParams = {
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
};

export const DEFAULT_PRESETS: PromptPreset[] = [
  { id: "default", name: "Default", prompt: "You are a helpful AI assistant.", icon: "💬" },
  { id: "coder", name: "Code Expert", prompt: "You are an expert software engineer. Write clean, efficient, well-documented code. Explain your reasoning when asked.", icon: "🛠" },
  { id: "writer", name: "Writer", prompt: "You are a skilled writer. Produce clear, engaging, well-structured prose. Adapt your tone to the context.", icon: "✍️" },
  { id: "analyst", name: "Data Analyst", prompt: "You are a data analyst. Provide structured analysis with clear methodology. Use tables and metrics when relevant.", icon: "📊" },
  { id: "tutor", name: "Tutor", prompt: "You are a patient, thorough tutor. Break down complex topics step by step. Check understanding before moving forward.", icon: "🎓" },
];
