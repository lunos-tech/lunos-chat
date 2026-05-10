import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { ProviderConfig } from "@/components/playground/ProviderModal";
import type { ModelParams, ChatMessage, ContextWindowChats, Attachment, MessageReasoningDetail, GeneratedImage, ImageConfig } from "@/types/chat";
import type { ToolDefinition } from "@/components/playground/ToolsModal";
import { sliceMessagesForContext } from "@/types/chat";

type ReasoningDelta = {
  reasoning_content?: string;
  reasoning?: string;
  reasoning_details?: unknown[];
};

/** Image payload shape returned under choices[].delta.images or choices[].message.images */
type ApiImagePart = {
  type?: string;
  image_url?: { url?: string };
};

type ExtraTool = { type: "web_search" };
type RequestTool = ChatCompletionTool | ExtraTool;

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

/**
 * Convert attachments into OpenAI-compatible content blocks.
 *
 * Formats per the Lunos docs:
 * - image   → { type: "image_url", image_url: { url } }
 * - pdf     → { type: "file", file: { filename, file_data } }
 * - audio   → { type: "input_audio", input_audio: { data, format } }
 * - video   → { type: "video_url", video_url: { url } }
 */
function attachmentToContentBlock(att: Attachment): Record<string, unknown> {
  switch (att.type) {
    case "image":
      return {
        type: "image_url",
        image_url: { url: att.dataUrl },
      };
    case "pdf":
      return {
        type: "file",
        file: {
          filename: att.name,
          file_data: att.dataUrl,
        },
      };
    case "audio": {
      // Extract raw base64 and format from the data URL
      const rawBase64 = att.dataUrl.includes(",") ? att.dataUrl.split(",")[1] : att.dataUrl;
      // Derive format from MIME: audio/wav → wav, audio/mpeg → mp3
      let format = att.mime.split("/")[1] || "wav";
      // Strip any extra parameters like ;codecs=opus
      format = format.split(";")[0];
      if (format === "mpeg") format = "mp3";
      return {
        type: "input_audio",
        input_audio: { data: rawBase64, format },
      };
    }
    case "video":
      return {
        type: "video_url",
        video_url: { url: att.dataUrl },
      };
  }
}

/** Build the messages array for the API call, including multimodal content */
function buildMessages(
  systemPrompt: string,
  chatMessages: ChatMessage[],
  maxContext: ContextWindowChats,
  inputModalities?: string[] | null,
): ChatCompletionMessageParam[] {
  const msgs: ChatCompletionMessageParam[] = [];
  const normalizedInputModalities = Array.isArray(inputModalities)
    ? inputModalities.map((m) => m.toLowerCase())
    : null;
  const supportsImageInput = !normalizedInputModalities || normalizedInputModalities.includes("image");
  const supportsAudioInput = !normalizedInputModalities || normalizedInputModalities.includes("audio") || normalizedInputModalities.includes("input_audio");

  if (systemPrompt.trim()) {
    msgs.push({ role: "system", content: systemPrompt });
  }

  const sliced = sliceMessagesForContext(chatMessages, maxContext);
  for (const m of sliced) {
    if (m.role === "user" || m.role === "assistant") {
      // If user message has attachments, build a content array
      if (m.role === "user" && m.attachments && m.attachments.length > 0) {
        const contentParts: Array<Record<string, unknown>> = [];

        // Text first (if present)
        if (m.content.trim()) {
          contentParts.push({ type: "text", text: m.content });
        }

        for (const att of m.attachments) {
          if (att.type === "image" && !supportsImageInput) continue;
          if (att.type === "audio" && !supportsAudioInput) continue;
          contentParts.push(attachmentToContentBlock(att));
        }

        msgs.push({ role: "user", content: contentParts as ChatCompletionMessageParam["content"] });
      } else {
        msgs.push({ role: m.role, content: m.content });
      }
    }
  }

  return msgs;
}

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onReasoningDelta: (text: string) => void;
  /** Called when the stream emits a generated image (via delta.images or final message.images). */
  onImage: (image: GeneratedImage) => void;
  onDone: (result: { content: string; reasoning: string; reasoningDetails: MessageReasoningDetail[]; images: GeneratedImage[] }) => void;
  onError: (error: string) => void;
}

// ─── Image parsing helpers ────────────────────────────────────────────

function mimeFromDataUrl(url: string): string | undefined {
  const match = /^data:([^;,]+)/i.exec(url);
  return match ? match[1] : undefined;
}

function createGeneratedImage(url: string): GeneratedImage {
  return {
    id: crypto.randomUUID(),
    url,
    mime: mimeFromDataUrl(url),
  };
}

/** Normalize an array of image parts from delta.images / message.images into GeneratedImage[]. */
function parseImageParts(parts: unknown): GeneratedImage[] {
  if (!Array.isArray(parts)) return [];
  const out: GeneratedImage[] = [];
  for (const p of parts) {
    if (!p || typeof p !== "object") continue;
    const url = (p as ApiImagePart).image_url?.url;
    if (typeof url === "string" && url.length > 0) {
      out.push(createGeneratedImage(url));
    }
  }
  return out;
}

function getReasoningTextFromDetail(detail: MessageReasoningDetail): string {
  if (detail.type === "reasoning.encrypted") return "";
  if (typeof detail.summary === "string" && detail.summary.trim()) return detail.summary;
  if (typeof detail.data === "string" && detail.data.trim()) return detail.data;
  return "";
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
  webSearch: boolean,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  supportedParams?: string[] | null,
  outputModalities?: string[] | null,
  inputModalities?: string[] | null,
  imageConfig?: ImageConfig | null,
): () => void {
  const client = createClient(provider);
  const messages = buildMessages(systemPrompt, chatMessages, maxContext, inputModalities);

  // Helper: check if a parameter is supported by the model
  // If supportedParams is null/undefined (no data), allow everything (backward compat)
  const supports = (param: string) => !supportedParams || supportedParams.includes(param);

  const openaiTools = supports("tools") ? buildTools(tools) : undefined;

  // Build combined tools array (function tools + web search)
  let allTools: RequestTool[] | undefined;
  if (webSearch || openaiTools) {
    allTools = [];
    if (openaiTools) allTools.push(...openaiTools);
    if (webSearch) allTools.push({ type: "web_search" });
  }

  // Decide which modalities to request. Per Lunos docs, image-capable models
  // should receive modalities: ["image", "text"] (or ["image"] for image-only).
  const wantsImage = Array.isArray(outputModalities) && outputModalities.includes("image");
  const wantsText = !Array.isArray(outputModalities) || outputModalities.includes("text");
  const modalities = wantsImage ? (wantsText ? ["image", "text"] : ["image"]) : undefined;

  let cancelled = false;

  const run = async () => {
    try {
      // OpenAI SDK types don't include `modalities` / `image_config`; pass as extras.
      const extraBody: Record<string, unknown> = {};
      if (modalities) extraBody.modalities = modalities;
      if (imageConfig && (imageConfig.aspect_ratio || imageConfig.image_size)) {
        extraBody.image_config = { ...imageConfig };
      }

      const stream = await client.chat.completions.create({
        model,
        messages,
        ...(supports("temperature") ? { temperature: params.temperature } : {}),
        ...(supports("top_p") ? { top_p: params.topP } : {}),
        ...(supports("max_tokens") ? { max_tokens: params.maxTokens } : {}),
        stream: true,
        ...(allTools ? { tools: allTools } : {}),
        ...(extraBody as Record<string, never>),
      });

      let accumulated = "";
      let accumulatedReasoning = "";
      const reasoningDetails: MessageReasoningDetail[] = [];
      const collectedImages: GeneratedImage[] = [];
      // Dedup image URLs so repeated deltas (or the final message echoing the same images) aren't added twice.
      const seenImageUrls = new Set<string>();

      const emitImages = (images: GeneratedImage[]) => {
        for (const img of images) {
          if (seenImageUrls.has(img.url)) continue;
          seenImageUrls.add(img.url);
          collectedImages.push(img);
          callbacks.onImage(img);
        }
      };

      for await (const chunk of stream) {
        if (cancelled || signal.aborted) break;

        const choice = chunk.choices?.[0] as typeof chunk.choices[0] & {
          delta?: { images?: unknown };
          message?: { images?: unknown };
        } | undefined;
        const delta = choice?.delta;
        if (!delta) continue;

        // Handle reasoning content (used by some models like Deepseek R1 via compatible APIs)
        const reasoningDelta = delta as typeof delta & ReasoningDelta;
        const reasoning = reasoningDelta.reasoning_content ?? reasoningDelta.reasoning;
        if (reasoning) {
          accumulatedReasoning += reasoning;
          callbacks.onReasoningDelta(reasoning);
        }

        const deltaReasoningDetails = reasoningDelta.reasoning_details;
        if (Array.isArray(deltaReasoningDetails)) {
          for (const detail of deltaReasoningDetails) {
            if (detail && typeof detail === "object") {
              const parsedDetail = detail as MessageReasoningDetail;
              if (parsedDetail.type === "reasoning.encrypted") {
                continue;
              }
              reasoningDetails.push(parsedDetail);
              if (!reasoning) {
                const textFromDetail = getReasoningTextFromDetail(parsedDetail);
                if (textFromDetail) {
                  const withSpacing = accumulatedReasoning ? `\n${textFromDetail}` : textFromDetail;
                  accumulatedReasoning += withSpacing;
                  callbacks.onReasoningDelta(withSpacing);
                }
              }
            }
          }
        }

        if (delta.content) {
          accumulated += delta.content;
          callbacks.onDelta(delta.content);
        }

        // Handle image output per dashboard docs:
        // - streaming: choices[].delta.images
        // - final: choices[].message.images (some providers echo it in the final chunk)
        const deltaImages = (delta as { images?: unknown }).images;
        if (deltaImages) emitImages(parseImageParts(deltaImages));

        const messageImages = choice?.message?.images;
        if (messageImages) emitImages(parseImageParts(messageImages));

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
        callbacks.onDone({
          content: accumulated,
          reasoning: accumulatedReasoning,
          reasoningDetails,
          images: collectedImages,
        });
      }
    } catch (err: unknown) {
      if (!cancelled && !signal.aborted) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "error" in err
              ? String((err as { error?: { message?: string } }).error?.message ?? "An error occurred while streaming the response.")
              : "An error occurred while streaming the response.";
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
