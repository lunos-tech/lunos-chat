import { useState } from "react";
import { useTheme } from "next-themes";
import { X, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const cleanOneDark = Object.fromEntries(
  Object.entries(oneDark).map(([key, value]) => [
    key,
    typeof value === "object" && value !== null
      ? { ...value, background: "transparent", backgroundColor: "transparent" }
      : value,
  ])
);

const cleanOneLight = Object.fromEntries(
  Object.entries(oneLight).map(([key, value]) => [
    key,
    typeof value === "object" && value !== null
      ? { ...value, background: "transparent", backgroundColor: "transparent" }
      : value,
  ])
);

interface Props {
  open: boolean;
  onClose: () => void;
  model: string;
  systemPrompt: string;
  params: { temperature: number; topP: number; maxTokens: number };
  baseUrl?: string | null;
}

const LANGUAGES = [
  { id: "curl", name: "cURL", icon: "/lang/curl.png", syntax: "bash" },
  { id: "python", name: "Python", icon: "/lang/python.png", syntax: "python" },
  { id: "javascript", name: "JavaScript", icon: "/lang/javascript.png", syntax: "javascript" },
  { id: "typescript", name: "TypeScript", icon: "/lang/typescript.png", syntax: "typescript" },
  { id: "go", name: "Go", icon: "/lang/go.png", syntax: "go" },
  { id: "rust", name: "Rust", icon: "/lang/rust.png", syntax: "rust" },
] as const;

type LangId = (typeof LANGUAGES)[number]["id"];

function generateSnippet(
  lang: LangId,
  model: string,
  systemPrompt: string,
  params: { temperature: number; topP: number; maxTokens: number },
  baseUrl?: string | null
): string {
  const escaped = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  const normalizedBase = (baseUrl && baseUrl.trim() ? baseUrl.trim() : "https://api.lunos.tech/v1").replace(/\/+$/, "");
  const endpoint = normalizedBase.endsWith("/chat/completions") ? normalizedBase : `${normalizedBase}/chat/completions`;

  switch (lang) {
    case "curl":
      return `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer $LUNOS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "system", "content": "${escaped(systemPrompt)}"},
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": ${params.temperature},
    "top_p": ${params.topP},
    "max_tokens": ${params.maxTokens}
  }'`;

    case "python":
      return `import requests

response = requests.post(
    "${endpoint}",
    headers={
        "Authorization": f"Bearer {LUNOS_API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "model": "${model}",
        "messages": [
            {"role": "system", "content": "${escaped(systemPrompt)}"},
            {"role": "user", "content": "Hello!"},
        ],
        "temperature": ${params.temperature},
        "top_p": ${params.topP},
        "max_tokens": ${params.maxTokens},
    },
)

print(response.json())`;

    case "javascript":
      return `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${LUNOS_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "${model}",
    messages: [
      { role: "system", content: "${escaped(systemPrompt)}" },
      { role: "user", content: "Hello!" },
    ],
    temperature: ${params.temperature},
    top_p: ${params.topP},
    max_tokens: ${params.maxTokens},
  }),
});

const data = await response.json();
console.log(data);`;

    case "typescript":
      return `interface ChatResponse {
  choices: { message: { role: string; content: string } }[];
}

const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${LUNOS_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "${model}",
    messages: [
      { role: "system", content: "${escaped(systemPrompt)}" },
      { role: "user", content: "Hello!" },
    ],
    temperature: ${params.temperature},
    top_p: ${params.topP},
    max_tokens: ${params.maxTokens},
  }),
});

const data: ChatResponse = await response.json();
console.log(data.choices[0].message.content);`;

    case "go":
      return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {
	body, _ := json.Marshal(map[string]interface{}{
		"model": "${model}",
		"messages": []map[string]string{
			{"role": "system", "content": "${escaped(systemPrompt)}"},
			{"role": "user", "content": "Hello!"},
		},
		"temperature": ${params.temperature},
		"top_p":       ${params.topP},
		"max_tokens":  ${params.maxTokens},
	})

	req, _ := http.NewRequest("POST",
		"${endpoint}",
		bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("LUNOS_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	fmt.Println(resp.Status)
}`;

    case "rust":
      return `use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let api_key = std::env::var("LUNOS_API_KEY")?;

    let body = json!({
        "model": "${model}",
        "messages": [
            {"role": "system", "content": "${escaped(systemPrompt)}"},
            {"role": "user", "content": "Hello!"}
        ],
        "temperature": ${params.temperature},
        "top_p": ${params.topP},
        "max_tokens": ${params.maxTokens}
    });

    let res = client
        .post("${endpoint}")
        .header(AUTHORIZATION, format!("Bearer {}", api_key))
        .header(CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await?;

    println!("{}", res.text().await?);
    Ok(())
}`;
  }
}

export default function CodeSnippetsModal({ open, onClose, model, systemPrompt, params, baseUrl }: Props) {
  const { resolvedTheme } = useTheme();
  const [activeLang, setActiveLang] = useState<LangId>("curl");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const prismStyle = resolvedTheme === "light" ? cleanOneLight : cleanOneDark;

  const code = generateSnippet(activeLang, model, systemPrompt, params, baseUrl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-2xl max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold tracking-wide text-foreground">CODE SNIPPETS</h2>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 border-b border-border px-5 py-2 overflow-x-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => { setActiveLang(lang.id); setCopied(false); }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeLang === lang.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <img src={lang.icon} alt={lang.name} className="h-3.5 w-3.5 object-contain" />
              {lang.name}
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="relative flex-1 overflow-auto p-5">
          <button
            onClick={handleCopy}
            className="absolute right-7 top-7 flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
          >
            {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <SyntaxHighlighter
            language={LANGUAGES.find((l) => l.id === activeLang)?.syntax ?? "bash"}
            style={prismStyle}
            customStyle={{
              margin: 0,
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              lineHeight: "1.625",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--code-block-bg))",
            }}
            codeTagProps={{ style: { background: "transparent" } }}
            showLineNumbers
            lineNumberStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "0.65rem" }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
