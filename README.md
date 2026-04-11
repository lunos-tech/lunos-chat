# Lunos — AI Playground

A developer-grade AI playground for chatting with multiple LLMs. Built with React, TypeScript, and Vite.

## Features

- **Multi-model support** — Switch between GPT-4o, Claude 3.5 Sonnet, Gemini Pro, Llama 3.1, and more
- **Chat sessions** — Create, manage, and switch between multiple conversations
- **System prompt presets** — Quick presets for coding, writing, data analysis, and tutoring
- **Parameter tuning** — Adjust temperature, top-p, and max tokens per session
- **Code snippets** — View and copy API integration code
- **Streaming responses** — Real-time token streaming with TPS & cost metadata
- **Responsive layout** — Sidebar navigation and collapsible control panel

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** — Dev server & build
- **Tailwind CSS** — Styling
- **shadcn/ui** (Radix primitives) — UI components
- **Framer Motion** — Animations
- **React Router** — Routing
- **TanStack Query** — Data fetching
- **react-markdown** + **react-syntax-highlighter** — Markdown & code rendering

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

The app will be available at `http://localhost:5173`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── components/
│   ├── playground/    # Core playground components
│   │   ├── PlaygroundLayout.tsx
│   │   ├── ChatArea.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatSidebar.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── TopBar.tsx
│   │   ├── ModelSelectorModal.tsx
│   │   ├── ProviderModal.tsx
│   │   ├── ToolsModal.tsx
│   │   └── CodeSnippetsModal.tsx
│   └── ui/            # shadcn/ui primitives
├── hooks/             # Custom React hooks
├── store/             # Chat state management
├── types/             # TypeScript type definitions
└── pages/             # Route pages
```
