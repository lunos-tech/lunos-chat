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
| `pnpm dev` | Start frontend dev server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm backend` | Start proxy server (Node.js) |
| `pnpm backend:dev` | Start proxy with watch mode |
| `pnpm backend:deploy` | Deploy proxy to Cloudflare Workers |

## Proxy Backend

The proxy backend handles RSA-encrypted API key decryption and forwards requests to upstream LLM providers. Built with **Hono** — runs on both **Cloudflare Workers** and **Node.js** (VPS).

### How it works

1. Frontend encrypts the user's API key with the server's RSA public key
2. Encrypted key is sent via `x-encrypted-api-key` header on each request
3. Proxy decrypts the key and forwards the request to the upstream provider

### Running locally

The proxy reads RSA keys from `backend/private.pem` and `backend/public.pem` (auto-generated on first run of the old server, or provide your own).

```bash
pnpm backend      # starts on :3001
pnpm backend:dev  # with file watching
```

### Deploying to Cloudflare Workers

```bash
# Set RSA keys as secrets
wrangler secret put RSA_PRIVATE_KEY --config backend/wrangler.toml
wrangler secret put RSA_PUBLIC_KEY --config backend/wrangler.toml

# Deploy
pnpm backend:deploy
```

### Deploying to VPS

Set environment variables `RSA_PRIVATE_KEY` and `RSA_PUBLIC_KEY` with the PEM contents, then:

```bash
pnpm backend
```

Or place `private.pem` and `public.pem` files in the `backend/` directory.