import { memo } from "react";
import { ExternalLink } from "lucide-react";

// Regex to match URLs - comprehensive pattern
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

// Match URLs without protocol (www. or domain patterns)
const URL_WITHOUT_PROTOCOL_REGEX = /(?<![\/\w])(?:www\.[\w\-]+\.[\w\-.]+|[\w\-]+\.(?:com|org|net|io|co|app|dev|vn|edu|gov|info|biz|me|tv|us|uk|de|fr|jp|kr|cn|ru|br|in|au|ca)(?:\/[^\s<>"{}|\\^`[\]]*)?)/gi;

interface LinkifiedContentProps {
  content: string;
  className?: string;
}

/**
 * Component that renders text with clickable links.
 * Automatically detects URLs and converts them to clickable anchor tags.
 */
export const LinkifiedContent = memo(function LinkifiedContent({ 
  content, 
  className = "" 
}: LinkifiedContentProps) {
  if (!content) return null;

  // Split content into parts - some are links, some are regular text
  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;
    
    // Combine all matches and sort by position
    const allMatches: { match: string; index: number; length: number }[] = [];
    
    // Find URLs with protocol
    let match;
    const protocolRegex = new RegExp(URL_REGEX.source, 'gi');
    while ((match = protocolRegex.exec(content)) !== null) {
      allMatches.push({
        match: match[0],
        index: match.index,
        length: match[0].length
      });
    }
    
    // Find URLs without protocol
    const noProtocolRegex = new RegExp(URL_WITHOUT_PROTOCOL_REGEX.source, 'gi');
    while ((match = noProtocolRegex.exec(content)) !== null) {
      // Check if this match overlaps with any existing match
      const overlaps = allMatches.some(
        m => (match!.index >= m.index && match!.index < m.index + m.length) ||
             (m.index >= match!.index && m.index < match!.index + match![0].length)
      );
      
      if (!overlaps) {
        allMatches.push({
          match: match[0],
          index: match.index,
          length: match[0].length
        });
      }
    }
    
    // Sort by position
    allMatches.sort((a, b) => a.index - b.index);
    
    // Build parts array
    for (const { match: urlMatch, index, length } of allMatches) {
      // Add text before this URL
      if (index > lastIndex) {
        parts.push(
          <span key={key++}>
            {content.slice(lastIndex, index)}
          </span>
        );
      }
      
      // Determine the full URL (add protocol if missing)
      const href = urlMatch.startsWith('http') ? urlMatch : `https://${urlMatch}`;
      
      // Clean display text - remove trailing punctuation that might have been captured
      let displayUrl = urlMatch;
      if (displayUrl.length > 50) {
        displayUrl = displayUrl.slice(0, 47) + "...";
      }
      
      parts.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors break-all"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{displayUrl}</span>
          <ExternalLink className="w-3 h-3 inline-block shrink-0 ml-0.5" />
        </a>
      );
      
      lastIndex = index + length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={key++}>
          {content.slice(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : content;
  };

  return (
    <span className={className}>
      {renderContent()}
    </span>
  );
});

export default LinkifiedContent;
