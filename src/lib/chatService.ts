import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { ProviderConfig } from "@/components/playground/ProviderModal";
import type { ModelParams, ChatMessage, ContextWindowChats } from "@/types/chat";
import type { ToolDefinition } from "@/components/playground/ToolsModal";
import { sliceMessagesForContext } from "@/types/chat";

function createClient(provider: ProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
    dangerouslyAllowBrowser: true,
  });
}

/** Convert internal ToolDefinition[] to OpenAI tools format */
function buildTools(tools: ToolDefinition[]): ChatCompletionTool[] | undefined {
  const valid = tools.filter((t) => t.name.trim());
  if (valid.length === 0) return undefined;

  return valid.map((t) => {
    const properties: Record<string, { type: string; description?: string }> = {};
    const required: string[] = [];
    for (const p of t.parameters) {
      if (!p.name.trim()) continue;
      properties[p.name] = { type: p.type };
      if (p.description) properties[p.name].description = p.description;
      if (p.required) required.push(p.name);
    }

    return {
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description || undefined,
        parameters: {
          type: "object" as const,
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    };
  });
}

/** Build the messages array for the API call */
function buildMessages(
  systemPrompt: string,
  chatMessages: ChatMessage[],
  maxContext: ContextWindowChats,
): ChatCompletionMessageParam[] {
  const msgs: ChatCompletionMessageParam[] = [];

  if (systemPrompt.trim()) {
    msgs.push({ role: "system", content: systemPrompt });
  }

  const sliced = sliceMessagesForContext(chatMessages, maxContext);
  for (const m of sliced) {
    if (m.role === "user" || m.role === "assistant") {
      msgs.push({ role: m.role, content: m.content });
    }
  }

  return msgs;
}

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * Summarize the first user message into a short chat title (max 6 words).
 * Uses a cheap non-streaming call.
 */
export async function summarizeTitle(
  provider: ProviderConfig,
  model: string,
  userMessage: string,
): Promise<string> {
  try {
    const client = createClient(provider);
    const response = await client.chat.completions.create({
      model,
      max_tokens: 20,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "Summarize the user's message into a short plain-text title under 10 words. Rules: NO markdown, NO asterisks, NO quotes, NO special formatting. Reply with ONLY the title text, nothing else.",
        },
        { role: "user", content: userMessage },
      ],
    });

    const raw = response.choices?.[0]?.message?.content?.trim() ?? "";
    // Strip any markdown formatting that might sneak through
    const title = raw.replace(/[*_`#>"\\[\]()]/g, "").trim();
    return title || userMessage.slice(0, 40);
  } catch {
    // Fallback to truncated message if summarization fails
    return userMessage.slice(0, 40);
  }
}

/**
 * Stream a chat completion from the configured provider.
 * Returns a cleanup function.
 */
export function streamChat(
  provider: ProviderConfig,
  model: string,
  systemPrompt: string,
  chatMessages: ChatMessage[],
  maxContext: ContextWindowChats,
  params: ModelParams,
  tools: ToolDefinition[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  supportedParams?: string[] | null,
): () => void {
  const client = createClient(provider);
  const messages = buildMessages(systemPrompt, chatMessages, maxContext);

  // Helper: check if a parameter is supported by the model
  // If supportedParams is null/undefined (no data), allow everything (backward compat)
  const supports = (param: string) => !supportedParams || supportedParams.includes(param);

  const openaiTools = supports("tools") ? buildTools(tools) : undefined;

  let cancelled = false;

  const run = async () => {
    try {
      const stream = await client.chat.completions.create({
        model,
        messages,
        ...(supports("temperature") ? { temperature: params.temperature } : {}),
        ...(supports("top_p") ? { top_p: params.topP } : {}),
        ...(supports("max_tokens") ? { max_tokens: params.maxTokens } : {}),
        stream: true,
        ...(openaiTools ? { tools: openaiTools } : {}),
      });

      let accumulated = "";
      let hasStartedReasoning = false;
      let hasFinishedReasoning = false;

      for await (const chunk of stream) {
        if (cancelled || signal.aborted) break;

        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        // Handle reasoning content (used by some models like Deepseek R1 via compatible APIs)
        const reasoning = (delta as any).reasoning_content;
        if (reasoning) {
          if (!hasStartedReasoning) {
            hasStartedReasoning = true;
            const header = "> 💭 **Thinking Process:**\n> ";
            accumulated += header;
            callbacks.onDelta(header);
          }
          // We must replace newlines with `\n> ` to keep the blockquote formatting valid as it streams.
          const formattedReasoning = reasoning.replace(/\n/g, "\n> ");
          accumulated += formattedReasoning;
          callbacks.onDelta(formattedReasoning);
        }

        // Handle standard text content
        if (delta.content) {
          if (hasStartedReasoning && !hasFinishedReasoning) {
            hasFinishedReasoning = true;
            const footer = "\n\n---\n\n";
            accumulated += footer;
            callbacks.onDelta(footer);
          }
          accumulated += delta.content;
          callbacks.onDelta(delta.content);
        }

        // Handle tool calls — render them as formatted text
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.function?.name) {
              const callText = `\n\n**🔧 Tool Call: \`${tc.function.name}\`**\n`;
              accumulated += callText;
              callbacks.onDelta(callText);
            }
            if (tc.function?.arguments) {
              accumulated += tc.function.arguments;
              callbacks.onDelta(tc.function.arguments);
            }
          }
        }
      }

      if (!cancelled && !signal.aborted) {
        callbacks.onDone(accumulated);
      }
    } catch (err: any) {
      if (!cancelled && !signal.aborted) {
        const message =
          err?.message || err?.error?.message || "An error occurred while streaming the response.";
        callbacks.onError(message);
      }
    }
  };

  run();

  // Listen for external abort
  const abortHandler = () => {
    cancelled = true;
  };
  signal.addEventListener("abort", abortHandler);

  return () => {
    cancelled = true;
    signal.removeEventListener("abort", abortHandler);
  };
}
