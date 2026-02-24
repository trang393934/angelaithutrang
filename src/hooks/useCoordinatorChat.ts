import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  mode?: string;
  ai_role?: string;
}

interface ProjectContext {
  name: string;
  platform_type: string;
  value_model: string;
  token_flow_model: string;
  vision_statement: string;
  status: string;
}

// Detect corruption in Vietnamese text
function hasTextCorruption(text: string): boolean {
  if (text.includes('\uFFFD')) return true;
  // Pattern: letter + ?? + letter (catches "gi??á", "thc??ực")
  if (/[a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]\?\?[a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text)) return true;
  return false;
}

export function useCoordinatorChat(projectId: string | undefined) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const messagesQuery = useQuery({
    queryKey: ["coordinator-chat", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coordinator_chat_messages")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as ChatMessage[]);
    },
    enabled: !!projectId,
  });

  const sendMessage = useCallback(
    async (
      content: string,
      mode: string,
      aiRole: string,
      projectContext: ProjectContext,
      existingMessages: ChatMessage[]
    ) => {
      if (!projectId || !session?.access_token) return;

      // Save user message to DB
      const { error: insertError } = await supabase
        .from("coordinator_chat_messages")
        .insert({
          project_id: projectId,
          user_id: session.user.id,
          role: "user",
          content,
          mode,
          ai_role: aiRole,
        });
      if (insertError) {
        toast.error("Failed to save message");
        return;
      }

      setIsStreaming(true);
      setStreamingContent("");

      const chatMessages = [
        ...existingMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      const endpointUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coordinator-chat`;

      try {
        const resp = await fetch(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: chatMessages,
            mode,
            ai_role: aiRole,
            project_context: projectContext,
          }),
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({}));
          if (resp.status === 402) {
            toast.error("⚡ AI credits đã hết. Vui lòng nạp thêm credits trong Settings → Workspace → Usage.");
            setIsStreaming(false);
            setStreamingContent("");
            return;
          }
          if (resp.status === 429) {
            toast.error("⏳ Quá nhiều yêu cầu. Vui lòng thử lại sau vài giây.");
            setIsStreaming(false);
            setStreamingContent("");
            return;
          }
          throw new Error(errorData.error || `Error ${resp.status}`);
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                setStreamingContent(fullContent);
              }
            } catch {
              // Re-buffer incomplete JSON
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        let cleanContent = fullContent;

        // Corruption detection: if stream has corruption, fallback to non-stream
        if (hasTextCorruption(fullContent)) {
          console.warn("⚠️ Corruption detected in coordinator stream — falling back to non-stream");
          try {
            const fallbackResp = await fetch(endpointUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                messages: chatMessages,
                mode,
                ai_role: aiRole,
                project_context: projectContext,
                stream: false,
              }),
            });
            if (fallbackResp.ok) {
              const fallbackData = await fallbackResp.json();
              if (fallbackData.content) {
                cleanContent = fallbackData.content;
                setStreamingContent(cleanContent);
              }
            }
          } catch (fallbackErr) {
            console.error("Non-stream fallback failed:", fallbackErr);
          }
        }

        // Save assistant message to DB
        if (cleanContent) {
          await supabase.from("coordinator_chat_messages").insert({
            project_id: projectId,
            user_id: session.user.id,
            role: "assistant",
            content: cleanContent,
            mode,
            ai_role: aiRole,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["coordinator-chat", projectId] });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "AI error");
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [projectId, session, queryClient]
  );

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    refetch: messagesQuery.refetch,
  };
}
