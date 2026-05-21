# Lunos AI Playground — Technical Reference

## Project Overview & Purpose

Lunos Playground is a developer-grade AI chat playground for testing prompts, comparing LLM outputs, tuning model parameters, and generating API integration code. It runs entirely in the browser with no backend — all state (sessions, API keys, settings) is persisted in `localStorage`. The app connects directly to OpenAI-compatible API endpoints configured by the user.

**Live URL:** https://chat.lunos.tech  
**Repository:** https://github.com/superXdev/lunos

---

## Architecture & Design Patterns

| Pattern | Description |
|---------|-------------|
| **SPA (Single-Page Application)** | Client-only React app deployed as static assets to Cloudflare Pages |
| **Custom Hook State Management** | `useChatStore()` hook with `useState` + `localStorage` persistence (no Redux/Zustand) |
| **Component Composition** | Playground assembled from discrete, single-responsibility components |
| **OpenAI SDK (browser)** | Uses the official `openai` npm package with `dangerouslyAllowBrowser: true` for streaming |
| **Headless UI Primitives** | shadcn/ui (Radix) for accessible, unstyled primitives; custom styling via Tailwind |
| **Theme System** | CSS custom properties (HSL) toggled via `next-themes` class strategy |
| **SEO via Imperative DOM** | `SeoHead` component sets `<meta>` tags at runtime (no SSR) |
| **URL ↔ State Sync** | Two `useEffect` hooks in `PlaygroundLayout` keep `/chat/:id` in sync with the active session |

---

## Tech Stack (exact versions from package.json)

### Runtime Dependencies

| Package | Version |
|---------|---------|
| react | ^18.3.1 |
| react-dom | ^18.3.1 |
| react-router-dom | ^6.30.1 |
| @tanstack/react-query | ^5.83.0 |
| openai | ^6.34.0 |
| framer-motion | ^11.0.0 |
| react-markdown | ^9.0.0 |
| remark-gfm | ^4.0.1 |
| react-syntax-highlighter | ^15.6.1 |
| next-themes | ^0.3.0 |
| lucide-react | ^0.462.0 |
| sonner | ^1.7.4 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^2.6.0 |
| tailwindcss-animate | ^1.0.7 |
| zod | ^3.25.76 |
| date-fns | ^3.6.0 |
| cmdk | ^1.1.1 |
| vaul | ^0.9.9 |
| react-resizable-panels | ^2.1.9 |
| recharts | ^2.15.4 |
| react-hook-form | ^7.61.1 |
| @hookform/resolvers | ^3.10.0 |
| embla-carousel-react | ^8.6.0 |
| input-otp | ^1.4.2 |
| react-day-picker | ^8.10.1 |

### Radix UI Primitives

All `@radix-ui/react-*` packages (accordion, alert-dialog, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip).

### Dev Dependencies

| Package | Version |
|---------|---------|
| vite | ^5.4.19 |
| @vitejs/plugin-react-swc | ^3.11.0 |
| typescript | ^5.8.3 |
| tailwindcss | ^3.4.17 |
| postcss | ^8.5.6 |
| autoprefixer | ^10.4.21 |
| @tailwindcss/typography | ^0.5.16 |
| eslint | ^9.32.0 |
| typescript-eslint | ^8.38.0 |
| eslint-plugin-react-hooks | ^5.2.0 |
| eslint-plugin-react-refresh | ^0.4.20 |
| vitest | ^3.2.4 |
| @testing-library/react | ^16.0.0 |
| @testing-library/jest-dom | ^6.6.0 |
| jsdom | ^20.0.3 |
| @playwright/test | ^1.57.0 |
| wrangler | ^4.20.0 |
| lovable-tagger | ^1.1.13 |
| globals | ^15.15.0 |
| @types/node | ^22.16.5 |
| @types/react | ^18.3.23 |
| @types/react-dom | ^18.3.7 |

---

## Directory Structure

```
playground/
├── index.html                  # Entry HTML with inline theme script & SEO meta
├── package.json
├── vite.config.ts              # Vite config (SWC, path aliases, dedup)
├── tailwind.config.ts          # Tailwind theme extensions
├── tsconfig.json               # Project references root
├── tsconfig.app.json           # App source config (ES2020, react-jsx)
├── tsconfig.node.json          # Node/Vite config (ES2022, strict)
├── eslint.config.js            # Flat ESLint config (typescript-eslint)
├── vitest.config.ts            # Vitest (jsdom, globals, setup file)
├── playwright.config.ts        # Playwright (lovable-agent config)
├── playwright-fixture.ts       # Playwright fixture re-export
├── wrangler.toml               # Cloudflare Pages deployment
├── components.json             # shadcn/ui CLI configuration
├── postcss.config.js
├── src/
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Providers + Router
│   ├── index.css               # Tailwind directives + CSS variables
│   ├── types/
│   │   └── chat.ts             # Core type definitions & constants
│   ├── store/
│   │   └── chatStore.ts        # useChatStore() hook
│   ├── lib/
│   │   ├── chatService.ts      # OpenAI streaming + title summarization
│   │   ├── seo.ts              # SEO meta builder
│   │   └── utils.ts            # cn() utility
│   ├── hooks/
│   │   ├── use-toast.ts        # Toast state management
│   │   └── use-mobile.tsx      # useIsMobile() breakpoint hook
│   ├── pages/
│   │   ├── Index.tsx           # Main playground page
│   │   └── NotFound.tsx        # 404 page
│   ├── components/
│   │   ├── SeoHead.tsx         # Runtime SEO meta tag injection
│   │   ├── NavLink.tsx         # React Router NavLink wrapper
│   │   ├── theme-provider.tsx  # next-themes ThemeProvider wrapper
│   │   ├── playground/         # Core playground components
│   │   │   ├── PlaygroundLayout.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatSidebar.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── ModelSelectorModal.tsx
│   │   │   ├── ProviderModal.tsx
│   │   │   ├── ToolsModal.tsx
│   │   │   ├── CodeSnippetsModal.tsx
│   │   │   └── WelcomeModal.tsx
│   │   └── ui/                 # shadcn/ui primitives (~40 components)
│   └── test/
│       └── setup.ts            # Vitest setup (jest-dom + matchMedia mock)
```

---

## Component Hierarchy & Responsibilities

```
App
├── ThemeProvider (next-themes, class strategy, dark default)
│   └── QueryClientProvider (TanStack Query)
│       └── TooltipProvider
│           ├── Toaster (radix toast)
│           ├── Sonner (sonner toast)
│           └── BrowserRouter
│               └── Routes
│                   ├── "/" → Index → PlaygroundLayout
│                   ├── "/chat/:id" → Index → PlaygroundLayout
│                   └── "*" → NotFound
```

### PlaygroundLayout (orchestrator)

The central component that:
- Instantiates `useChatStore()`
- Manages streaming state (`isStreaming`, `AbortController`)
- Coordinates URL ↔ store sync via `useParams` / `useNavigate`
- Handles `runStream()` — the core send/stream/update cycle
- Renders all child panels and modals

### Component Responsibilities

| Component | Role |
|-----------|------|
| **ChatSidebar** | Session list (grouped by date), new/delete chat, theme toggle, external links |
| **TopBar** | Sidebar toggle, model display + selector trigger, control panel toggle |
| **ChatArea** | Message list with auto-scroll, empty state, wraps `ChatInput` |
| **ChatInput** | Textarea with auto-resize, file attachments (image/PDF/audio/video), web search toggle, mic recording, context window selector, send/stop buttons |
| **ChatMessage** | Renders user/assistant messages with markdown, code highlighting, reasoning collapse, generated images, attachments, metadata dropdown, edit/regenerate/delete actions |
| **ControlPanel** | Right sidebar: provider config, preset selector, system prompt editor, parameter sliders (temperature/topP/maxTokens), image output config, tools button, code snippets button |
| **ModelSelectorModal** | Fetches `/models` from provider, fuzzy search, keyboard navigation, caches results in localStorage |
| **ProviderModal** | Provider selection (Lunos AI, OpenAI, Anthropic, Google, Groq, Custom), API key input, base URL config |
| **ToolsModal** | Visual tool/function definition editor + JSON import |
| **CodeSnippetsModal** | Generates API code snippets in cURL, Python, JavaScript, TypeScript, Go, Rust |
| **WelcomeModal** | First-visit onboarding modal |
| **SeoHead** | Imperatively sets document title, meta, OG, and Twitter tags |

---

## State Management (chatStore)

**File:** `src/store/chatStore.ts`  
**Pattern:** Custom React hook (`useChatStore`) using `useState` + `useEffect` for localStorage persistence.

### State Shape

| State | Type | Default |
|-------|------|---------|
| `sessions` | `ChatSession[]` | Loaded from localStorage or `[createSession("gpt-4o")]` |
| `activeSessionId` | `string` | From localStorage or first session ID |
| `params` | `ModelParams` | `{ temperature: 0.7, topP: 1, maxTokens: 4096 }` |
| `maxContextChats` | `ContextWindowChats` | `8` |
| `sidebarOpen` | `boolean` | `true` on desktop (≥1024px), `false` on mobile |
| `controlPanelOpen` | `boolean` | `false` |

### Exposed Actions

| Action | Description |
|--------|-------------|
| `addMessage(msg)` | Appends a message to the active session |
| `updateLastAssistantMessage(...)` | Updates the last assistant message (streaming content, metadata, reasoning, images) |
| `updateSessionTitle(title)` | Sets the active session's title |
| `setSystemPrompt(prompt)` | Updates active session's system prompt |
| `setModel(model)` | Updates active session's model |
| `newChat()` | Creates a new session with the current model, sets it active |
| `deleteSession(id)` | Removes a session; creates a fresh one if none remain |
| `deleteMessage(id)` | Removes a specific message from the active session |
| `truncateMessages(id)` | Removes all messages from the given message ID onward |
| `setActiveSessionId(id)` | Switches active session |
| `setParams(params)` | Updates model parameters |
| `setMaxContextChats(v)` | Updates context window size |
| `setSidebarOpen(v)` | Toggles sidebar |
| `setControlPanelOpen(v)` | Toggles control panel |

### Persistence

- **Sessions:** Serialized to `localStorage["lunos-chat-sessions"]` on every change (skips first render)
- **Active session ID:** `localStorage["lunos-active-session"]`
- **Provider config:** `localStorage["lunos-provider-config"]` (managed by ProviderModal)
- **Fetched models cache:** `localStorage["lunos-fetched-models"]` (10-minute TTL, invalidated on provider change)
- **Theme:** `localStorage["lunos-playground-theme"]` (managed by next-themes)
- **Welcome flag:** `localStorage["lunos_welcomed"]`

---

## API/Service Layer (chatService)

**File:** `src/lib/chatService.ts`

### `streamChat(provider, model, systemPrompt, chatMessages, maxContext, params, tools, webSearch, callbacks, signal, supportedParams?, outputModalities?, inputModalities?, imageConfig?)`

Streams a chat completion using the OpenAI SDK. Returns a cleanup function.

**Flow:**
1. Creates an `OpenAI` client with the provider's `baseUrl` and `apiKey` (`dangerouslyAllowBrowser: true`)
2. Builds the messages array via `buildMessages()` — applies context window slicing, converts multimodal attachments to OpenAI content blocks
3. Constructs tools array (function tools + optional `{ type: "web_search" }`)
4. Determines output modalities (adds `["image", "text"]` if model supports image output)
5. Calls `client.chat.completions.create({ stream: true, ... })`
6. Iterates the async stream, accumulating content, reasoning, and images
7. Calls `callbacks.onDelta`, `onReasoningDelta`, `onImage` during streaming
8. Calls `callbacks.onDone` or `callbacks.onError` on completion

**Multimodal attachment conversion:**
- `image` → `{ type: "image_url", image_url: { url } }`
- `pdf` → `{ type: "file", file: { filename, file_data } }`
- `audio` → `{ type: "input_audio", input_audio: { data, format } }`
- `video` → `{ type: "video_url", video_url: { url } }`

### `summarizeTitle(provider, model, userMessage)`

Non-streaming call to generate a short chat title (≤10 words) from the first user message. Falls back to truncated message on failure.

### Context Window Slicing

`sliceMessagesForContext(messages, max)` — if `max` is a number, returns only the last `max` messages; if `"all"`, returns everything.

---

## Type Definitions

**File:** `src/types/chat.ts`

### Core Types

```typescript
type MessageRole = "user" | "assistant" | "system";
type AttachmentType = "image" | "pdf" | "audio" | "video";
type ContextWindowChats = 4 | 8 | 16 | 32 | 64 | "all";

interface Attachment {
  id: string; type: AttachmentType; name: string; mime: string;
  size: number; dataUrl: string; previewUrl?: string;
}

interface MessageMetadata {
  tokenCount?: number; tps?: number; cost?: number;
  duration?: number; contextMessageCount?: number;
}

interface MessageReasoningDetail {
  type?: string; summary?: string; format?: string;
  index?: number; data?: string; id?: string;
}

interface GeneratedImage { id: string; url: string; mime?: string; }
interface ImageConfig { aspect_ratio?: string; image_size?: string; }

interface ChatMessage {
  id: string; role: MessageRole; content: string;
  reasoning?: string; reasoningDetails?: MessageReasoningDetail[];
  model?: string; timestamp: number; isStreaming?: boolean;
  metadata?: MessageMetadata; attachments?: Attachment[];
  generatedImages?: GeneratedImage[];
}

interface ChatSession {
  id: string; title: string; messages: ChatMessage[];
  systemPrompt: string; model: string;
  createdAt: number; updatedAt: number;
}

interface ModelConfig {
  id: string; name: string; provider: string; maxTokens: number;
  supportsStreaming: boolean; supportsImages: boolean; icon: string;
  inputPrice: number; outputPrice: number; avgTps: number;
}

interface ModelParams { temperature: number; topP: number; maxTokens: number; }
interface PromptPreset { id: string; name: string; prompt: string; icon?: string; }
```

### Constants

- `DEFAULT_MODELS` — 6 pre-defined models (GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Claude 3 Opus, Gemini Pro, Llama 3.1 70B)
- `DEFAULT_PARAMS` — `{ temperature: 0.7, topP: 1, maxTokens: 4096 }`
- `DEFAULT_CONTEXT_WINDOW_CHATS` — `8`
- `CONTEXT_WINDOW_CHAT_OPTIONS` — `[4, 8, 16, 32, 64]`
- `DEFAULT_PRESETS` — 5 system prompt presets (Default, Code Expert, Writer, Data Analyst, Tutor)

### Provider Types (from ProviderModal)

```typescript
interface ProviderConfig { id: string; name: string; baseUrl: string; apiKey: string; }
```

### Tool Types (from ToolsModal)

```typescript
interface ToolDefinition { id: string; name: string; description: string; parameters: ToolParam[]; }
interface ToolParam { id: string; name: string; type: "string"|"number"|"boolean"|"array"|"object"; description: string; required: boolean; }
```

---

## Routing

**Router:** React Router v6 (`BrowserRouter`)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Index` → `PlaygroundLayout` | Main playground (new session) |
| `/chat/:id` | `Index` → `PlaygroundLayout` | Playground with specific session active |
| `*` | `NotFound` | 404 page |

**URL ↔ State Sync (in PlaygroundLayout):**
- Effect 1: When `store.activeSessionId` changes → navigate to `/chat/:id`
- Effect 2: When URL `:id` changes (e.g., browser back) → update store's active session

---

## Styling

### Tailwind Configuration

- **Dark mode:** Class-based (`darkMode: ["class"]`)
- **Fonts:** Space Grotesk (sans), JetBrains Mono (mono)
- **Border radius:** CSS variable `--radius` (0.375rem)
- **Animations:** `accordion-down`, `accordion-up`, `pulse-dot`
- **Plugin:** `tailwindcss-animate`

### CSS Variables (HSL)

Defined in `src/index.css` under `:root` (light) and `.dark` (dark):

| Variable | Purpose |
|----------|---------|
| `--background`, `--foreground` | Page background/text |
| `--primary`, `--primary-foreground` | Brand teal accent |
| `--surface-1/2/3` | Layered surface backgrounds |
| `--text-primary/secondary/tertiary` | Text hierarchy |
| `--accent-glow`, `--accent-subtle` | Accent variations |
| `--user-bubble`, `--ai-bubble` | Chat message backgrounds |
| `--code-block-bg` | Code block background |
| `--success`, `--warning` | Status colors |
| `--sidebar-*` | Sidebar-specific colors |

### Theme Toggle

- Managed by `next-themes` with `attribute="class"` and `storageKey="lunos-playground-theme"`
- Default theme: `dark`
- Inline script in `index.html` prevents FOUC by reading localStorage before React hydrates

### Custom Scrollbar

Thin 6px scrollbar with `surface-3` thumb color, transparent track.

---

## Build & Deployment

### Vite Configuration

```typescript
{
  server: { host: "::", port: 8080, hmr: { overlay: false } },
  plugins: [react(), componentTagger() /* dev only */],
  resolve: {
    alias: { "@": "./src" },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime",
             "@tanstack/react-query", "@tanstack/query-core"],
  },
}
```

- **SWC** for fast React transforms (`@vitejs/plugin-react-swc`)
- **lovable-tagger** plugin in development mode only
- **Path alias:** `@/` → `./src/`
- **Deduplication** of React and TanStack Query to prevent multiple instances

### Scripts

| Command | Action |
|---------|--------|
| `pnpm dev` | Start dev server (port 8080) |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (single run) |
| `pnpm test:watch` | Vitest (watch mode) |
| `pnpm deploy:worker` | Build + `wrangler deploy` |
| `pnpm dev:worker` | Build + `wrangler dev` |

### Cloudflare Pages (Wrangler)

```toml
name = "lunos-playground"
compatibility_date = "2026-05-10"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

- Deploys the `dist/` directory as static assets
- SPA fallback: all unmatched routes serve `index.html`

---

## Testing Setup

### Unit Tests (Vitest)

**Config:** `vitest.config.ts`
- Environment: `jsdom`
- Globals: `true` (no need to import `describe`, `it`, `expect`)
- Setup file: `src/test/setup.ts`
- Pattern: `src/**/*.{test,spec}.{ts,tsx}`

**Setup file** (`src/test/setup.ts`):
- Imports `@testing-library/jest-dom` for DOM matchers
- Mocks `window.matchMedia` (returns `matches: false`)

### E2E Tests (Playwright)

**Config:** `playwright.config.ts`
- Uses `lovable-agent-playwright-config` package
- Fixture re-exported from `playwright-fixture.ts`

---

## Notable Patterns & Conventions

### ID Generation
- `crypto.randomUUID()` for all entity IDs (sessions, messages, attachments, tools)

### Streaming Architecture
- `AbortController` + cleanup function pattern for cancellable streams
- Accumulated content updated via `updateLastAssistantMessage()` on every delta
- Token count estimated as `(content.length + reasoning.length) / 4`
- TPS calculated as `tokenCount / duration`

### Multimodal Support
- Images, PDFs, audio, and video can be attached to user messages
- Audio recording via `MediaRecorder` API (WebM format)
- Clipboard paste detection for images
- Attachments filtered based on model's `inputModalities`
- Generated images rendered in a gallery with download/open-in-tab actions

### Reasoning/Thinking Display
- Supports `reasoning_content`, `reasoning`, and `reasoning_details` from streaming deltas
- Collapsible "Reasoning" section in assistant messages
- Encrypted reasoning details are filtered out

### Model Discovery
- Fetches available models from provider's `/models` endpoint
- Caches in localStorage with 10-minute TTL
- Supports `supportedParameters`, `outputModalities`, `inputModalities` metadata
- Parameters/features conditionally shown based on model capabilities

### Web Search
- Sends `{ type: "web_search" }` as an additional tool alongside function tools
- Toggle in ChatInput toolbar

### Image Generation
- Detects models with `outputModalities: ["image"]`
- Sends `modalities: ["image", "text"]` in request body
- Supports `image_config` with `aspect_ratio` and `image_size`
- Parses `delta.images` / `message.images` from streaming response

### Code Snippets
- Generates ready-to-use API code reflecting current model, system prompt, and parameters
- Supports 6 languages: cURL, Python, JavaScript, TypeScript, Go, Rust

### SEO
- Static meta tags in `index.html` for crawlers
- Dynamic `SeoHead` component updates tags at runtime for SPA navigation
- JSON-LD structured data (WebApplication schema)
- Open Graph and Twitter Card meta tags

### Responsive Design
- Sidebar: fixed overlay on mobile (<1024px), relative panel on desktop
- Control panel: slide-in from right on mobile, inline on desktop
- Auto-close sidebar on mobile after session selection

### Error Handling
- Stream errors displayed inline as formatted error messages
- Provider fetch failures shown with retry button
- Toast notifications for user-facing errors (via Sonner)
- Graceful fallbacks (title summarization falls back to truncation)

### localStorage Keys

| Key | Content |
|-----|---------|
| `lunos-chat-sessions` | All chat sessions (JSON) |
| `lunos-active-session` | Active session ID |
| `lunos-provider-config` | Provider configuration (JSON) |
| `lunos-fetched-models` | Cached models list with TTL |
| `lunos-playground-theme` | Theme preference (dark/light/system) |
| `lunos_welcomed` | Welcome modal dismissed flag |
