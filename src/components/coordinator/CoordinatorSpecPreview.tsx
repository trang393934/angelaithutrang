import { ChatMessage } from "@/hooks/useCoordinatorChat";
import { Button } from "@/components/ui/button";
import { Copy, Download, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  messages: ChatMessage[];
  streamingContent?: string;
  onClose: () => void;
}

function getLastAssistantContent(messages: ChatMessage[], streamingContent?: string): string {
  if (streamingContent) return streamingContent;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  return lastAssistant?.content || "No spec output yet. Start a conversation to generate content.";
}

export function CoordinatorSpecPreview({ messages, streamingContent, onClose }: Props) {
  const content = getLastAssistantContent(messages, streamingContent);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spec-output.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const allAssistant = messages.filter((m) => m.role === "assistant").map((m) => m.content);
    const blob = new Blob([JSON.stringify({ outputs: allAssistant }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spec-output.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple render
  const rendered = content
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted/50 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n/g, '<br/>');

  return (
    <div className="flex flex-col h-full border-l">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/50">
        <span className="text-sm font-medium">Spec Preview</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard} title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadMarkdown} title="Download MD">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
      <div className="border-t p-2 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={downloadMarkdown}>
          Export .md
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={downloadJSON}>
          Export .json
        </Button>
      </div>
    </div>
  );
}
