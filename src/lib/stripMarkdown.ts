/**
 * Strip Markdown symbols from text while preserving numbered lists.
 * Used as a frontend safety net for Angel AI responses.
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // Note: We intentionally do NOT strip \uFFFD (Unicode replacement characters)
  // as this causes Vietnamese diacritics to be lost when streaming splits multi-byte chars

  // Remove code blocks (``` ... ```)
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    // Keep the content inside code blocks, just remove the backticks
    return match.replace(/```/g, '').trim();
  });

  // Remove inline code backticks
  result = result.replace(/`([^`]+)`/g, '$1');

  // Remove heading markers (## or ###)
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Remove bold+italic (***text***)
  result = result.replace(/\*{3}(.+?)\*{3}/g, '$1');

  // Remove bold (**text**)
  result = result.replace(/\*{2}(.+?)\*{2}/g, '$1');

  // Remove italic (*text*) but NOT numbered list patterns like "1. "
  // Only remove * when it's used as italic wrapper (not standalone asterisks)
  result = result.replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '$1');

  // Remove blockquote markers
  result = result.replace(/^>\s?/gm, '');

  // Remove horizontal rules
  result = result.replace(/^-{3,}$/gm, '');
  result = result.replace(/^\*{3,}$/gm, '');

  // Remove bullet point markers (- item or * item at line start)
  result = result.replace(/^[-*]\s+/gm, '');

  // Clean up any remaining double asterisks or backticks
  result = result.replace(/\*\*/g, '');
  result = result.replace(/`/g, '');

  // Clean up excessive blank lines (max 1 blank line)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
