import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";
import { ChatMessage } from "@/hooks/useCoordinatorChat";
import { MODES } from "./ModeSelector";
import { ROLES } from "./RoleSelector";
import { cn } from "@/lib/utils";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  mode: string;
  aiRole: string;
  onSend: (content: string) => void;
}

// Simple markdown-ish rendering (bold, headers, code blocks)
function renderContent(text: string) {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted/50 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n/g, '<br/>');
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  product_spec: [
    "Generate full PRD for this platform",
    "Define target user personas",
    "Create feature prioritization matrix",
  ],
  smart_contract: [
    "Design token reward logic",
    "Review mint/burn security",
    "Audit checklist for this contract",
  ],
  tokenomics: [
    "Simulate token supply over 5 years",
    "Design reward sustainability model",
    "Analyze inflation risk",
  ],
  ux_flow: [
    "Map complete user onboarding journey",
    "Design earn flow user experience",
    "Create error handling patterns",
  ],
  growth: [
    "Design viral referral loop",
    "Plan launch strategy for first 1000 users",
    "Define key growth metrics",
  ],
  governance: [
    "Run PPLP compliance check",
    "Evaluate token sustainability risk",
    "Check Light Constitution alignment",
  ],
};

export function CoordinatorChat({ messages, isStreaming, streamingContent, mode, aiRole, onSend }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode;
  const roleLabel = ROLES.find((r) => r.id === aiRole)?.label ?? aiRole;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const prompts = SUGGESTED_PROMPTS[mode] || SUGGESTED_PROMPTS.product_spec;

  return (
    <div className="flex flex-col h-full">
      {/* Active badges */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/50">
        <Badge variant="outline" className="text-xs">{modeLabel}</Badge>
        <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-4 text-sm">Start building with Angel AI. Try a prompt:</p>
            <div className="flex flex-col gap-2 max-w-md">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => { setInput(p); }}
                  className="text-left text-sm px-4 py-2.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-4 py-3 text-sm bg-muted/60">
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderContent(streamingContent) }} />
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-3 bg-muted/60 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Angel AI..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon" className="shrink-0 h-[44px] w-[44px]">
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
