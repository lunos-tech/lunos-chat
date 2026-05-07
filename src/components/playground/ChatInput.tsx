import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Square, Paperclip, Globe, ImagePlus, Mic, MicOff, History, X, FileText, Film, Music } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTEXT_WINDOW_CHAT_OPTIONS,
  DEFAULT_CONTEXT_WINDOW_CHATS,
  type ContextWindowChats,
  type Attachment,
  type AttachmentType,
} from "@/types/chat";

interface Props {
  onSend: (msg: string, attachments: Attachment[], webSearch: boolean) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  maxContextChats: ContextWindowChats;
  onMaxContextChatsChange: (v: ContextWindowChats) => void;
}

// ─── Accept maps ────────────────────────────────────────────────────

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const PDF_ACCEPT = "application/pdf";
const AUDIO_ACCEPT = "audio/wav,audio/mp3,audio/mpeg,audio/ogg,audio/flac,audio/aac,audio/m4a,audio/webm";
const VIDEO_ACCEPT = "video/mp4,video/mpeg,video/webm,video/quicktime";
const FILE_ACCEPT = `${IMAGE_ACCEPT},${PDF_ACCEPT},${AUDIO_ACCEPT},${VIDEO_ACCEPT}`;

// ─── Helpers ────────────────────────────────────────────────────────

function getAttachmentType(mime: string): AttachmentType {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "image"; // fallback
}

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({
        id: crypto.randomUUID(),
        type: getAttachmentType(file.type),
        name: file.name,
        mime: file.type,
        size: file.size,
        dataUrl,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function contextChatsToSelectValue(v: ContextWindowChats) {
  return v === "all" ? "all" : String(v);
}

function selectValueToContextChats(s: string): ContextWindowChats {
  if (s === "all") return "all";
  const n = Number(s);
  return (CONTEXT_WINDOW_CHAT_OPTIONS as readonly number[]).includes(n)
    ? (n as ContextWindowChats)
    : DEFAULT_CONTEXT_WINDOW_CHATS;
}

function contextChatsTooltipSummary(v: ContextWindowChats) {
  return v === "all" ? "All messages" : `Last ${v} messages`;
}

// ─── Sub-components ─────────────────────────────────────────────────

function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Paperclip;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
            active
              ? "bg-primary/15 text-primary"
              : "text-text-tertiary hover:bg-surface-2 hover:text-foreground"
          }`}
        >
          <Icon size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function AttachmentBadgeIcon({ type }: { type: AttachmentType }) {
  switch (type) {
    case "image":
      return <ImagePlus size={12} />;
    case "pdf":
      return <FileText size={12} />;
    case "audio":
      return <Music size={12} />;
    case "video":
      return <Film size={12} />;
  }
}

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) {
  return (
    <div className="group/att relative flex items-center gap-2 rounded-md border border-border bg-surface-2/60 px-2.5 py-1.5 text-xs">
      {attachment.type === "image" && attachment.previewUrl ? (
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className="h-8 w-8 rounded object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-2 text-text-tertiary">
          <AttachmentBadgeIcon type={attachment.type} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{attachment.name}</p>
        <p className="text-text-tertiary">{formatFileSize(attachment.size)}</p>
      </div>
      <button
        onClick={onRemove}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-destructive/15 hover:text-destructive"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────

export default function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  maxContextChats,
  onMaxContextChatsChange,
}: Props) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, []);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const newAttachments = await Promise.all(fileArr.map(fileToAttachment));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  // Handle paste for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [addFiles]);

  const submit = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed, attachments, webSearchEnabled);
    setValue("");
    setAttachments([]);
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      submit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await addFiles(e.target.files);
      e.target.value = "";
    }
  };

  // Mic recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        await addFiles([file]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      // User denied microphone access or not supported
    }
  };

  const hasContent = value.trim() || attachments.length > 0;

  return (
    <div className="border-t border-border bg-background px-4 pb-4 pt-3">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-border bg-surface-1 transition-colors focus-within:border-primary/40">
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-2.5">
              {attachments.map((att) => (
                <AttachmentPreview
                  key={att.id}
                  attachment={att}
                  onRemove={() => removeAttachment(att.id)}
                />
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className="px-3 pt-2.5 pb-1">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachments.length > 0 ? "Add a message about your files..." : "Send a message..."}
              rows={1}
              disabled={disabled}
              className="max-h-[200px] min-h-[24px] w-full resize-none bg-transparent text-sm text-foreground placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              {/* Attach file (all types) */}
              <IconButton
                icon={Paperclip}
                label="Attach file"
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Upload image */}
              <IconButton
                icon={ImagePlus}
                label="Upload image"
                onClick={() => imageInputRef.current?.click()}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Web search toggle */}
              <IconButton
                icon={Globe}
                label={webSearchEnabled ? "Web search ON" : "Web search"}
                onClick={() => setWebSearchEnabled((v) => !v)}
                active={webSearchEnabled}
              />

              {/* Mic recording */}
              <IconButton
                icon={isRecording ? MicOff : Mic}
                label={isRecording ? "Stop recording" : "Voice input"}
                onClick={toggleRecording}
                active={isRecording}
              />

              {/* Context window */}
              <Select
                value={contextChatsToSelectValue(maxContextChats)}
                onValueChange={(s) => onMaxContextChatsChange(selectValueToContextChats(s))}
                disabled={disabled}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger
                      aria-label={`Window context: ${contextChatsTooltipSummary(maxContextChats)}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-text-tertiary shadow-none hover:bg-surface-2 hover:text-foreground focus:ring-0 focus:ring-offset-0 disabled:opacity-50 [&>svg:last-child]:hidden"
                    >
                      <History size={16} strokeWidth={1.75} className="shrink-0" />
                      <span className="sr-only">
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">{contextChatsTooltipSummary(maxContextChats)}</p>
                    <p className="mt-1 text-text-secondary">
                      How many recent messages are sent to the model; older ones are dropped first.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-normal text-text-tertiary">Context window</SelectLabel>
                    {CONTEXT_WINDOW_CHAT_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} msgs
                      </SelectItem>
                    ))}
                    <SelectItem value="all">All</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                {isStreaming ? (
                  <button
                    onClick={onStop}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/80"
                  >
                    <Square size={14} />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={!hasContent || disabled}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={16} />
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{isStreaming ? "Stop generation" : "Send message"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
