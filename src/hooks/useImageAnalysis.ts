import { useState, useCallback } from "react";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`;

// Detect corruption in Vietnamese text
function hasTextCorruption(text: string): boolean {
  if (text.includes('\uFFFD')) return true;
  if (/[a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]\?\?[a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text)) return true;
  return false;
}

export function useImageAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = useCallback(async (
    imageUrl: string,
    question: string,
    onStream?: (text: string) => void
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult("");

    try {
      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageUrl, question }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể phân tích hình ảnh");
      }

      if (!resp.body) throw new Error("Không có phản hồi từ server");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnalysisResult(fullText);
              onStream?.(fullText);
            }
          } catch {
            // Re-buffer incomplete JSON
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Corruption detection: fallback to non-stream if needed
      if (hasTextCorruption(fullText)) {
        console.warn("⚠️ Corruption detected in image analysis — falling back to non-stream");
        try {
          const fallbackResp = await fetch(ANALYZE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ imageUrl, question, stream: false }),
          });
          if (fallbackResp.ok) {
            const fallbackData = await fallbackResp.json();
            if (fallbackData.content) {
              fullText = fallbackData.content;
              setAnalysisResult(fullText);
              onStream?.(fullText);
            }
          }
        } catch (fallbackErr) {
          console.error("Non-stream fallback failed:", fallbackErr);
        }
      }

      return fullText;
    } catch (err: any) {
      const errorMessage = err.message || "Không thể phân tích hình ảnh";
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult("");
    setError(null);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeImage,
    clearAnalysis
  };
}
