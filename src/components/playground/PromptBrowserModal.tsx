import { useState, useEffect } from "react";
import { X, Search, Globe, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
}

interface PromptResult {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string; // The actual prompt text
}

// Temporary mock data until the real API is integrated
const MOCK_RESULTS: PromptResult[] = [
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: String(i + 1),
    title: `Expert Persona ${i + 1}`,
    category: ["Marketing", "Coding", "Writing", "Design", "Business"][i % 5],
    description: `A highly specialized system prompt for ${["copywriting", "React development", "blog writing", "UI design", "business strategy"][i % 5]} tasks.`,
    content: `You are an expert acting as Persona ${i + 1}. Follow all best practices in your respective field.`
  }))
];

export default function PromptBrowserModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PromptResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Note: Once the API is ready, replace this with actual fetch logic
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }

    // Simulate initial load / featured prompts
    setLoading(true);
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setLoading(false);
    }, 500);
  }, [open]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    // Simulate API search
    setTimeout(() => {
      const filtered = MOCK_RESULTS.filter(
        (r) => r.title.toLowerCase().includes(query.toLowerCase()) || 
               r.category.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 400);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Globe className="text-primary" size={18} />
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-foreground">PROMPTCREEK BROWSER</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Search and import prompts directly from PromptCreek</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-border bg-surface-2/50">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search by title or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[480px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-foreground">No prompts found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search terms.</p>
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onSelect(result.content);
                  onClose();
                }}
                className="group flex w-full flex-col gap-2 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="flex w-full items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{result.title}</h3>
                    <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {result.category}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{result.description}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
