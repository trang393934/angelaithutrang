/**
 * Content Moderation System for Angel AI Community
 * Detects and blocks harmful content with gentle reminders
 */

// Harmful domain patterns (partial matches)
const HARMFUL_DOMAIN_PATTERNS = [
  // Adult/Porn sites
  'porn', 'xxx', 'sex', 'adult', 'xvideos', 'xnxx', 'pornhub', 'xhamster', 
  'redtube', 'youporn', 'tube8', 'spankbang', 'brazzers', 'bangbros',
  'onlyfans', 'fansly', 'chaturbate', 'livejasmin', 'stripchat',
  // Violence/Gore
  'gore', 'liveleak', 'bestgore', 'documenting', 'theync', 'kaotic',
  // Gambling
  'casino', 'bet365', 'poker', 'gambling', 'slots', 'baccarat',
  // Malware/Phishing common patterns
  'free-iphone', 'win-prize', 'claim-reward', 'lottery-winner',
  // Piracy
  'torrent', 'piratebay', '1337x', 'rarbg', 'yts',
];

// Harmful words in Vietnamese and English
const HARMFUL_WORDS_VI = [
  // Violence
  'giết', 'chém', 'đâm', 'bắn chết', 'tra tấn', 'hành hình', 'tự sát', 'tự tử',
  // Sexual explicit
  'địt', 'đụ', 'chịch', 'fuck', 'sex', 'porn', 'làm tình', 'quan hệ tình dục',
  // Discrimination/Hate
  'đồ chó', 'con chó', 'thằng ngu', 'con ngu', 'đồ ngu', 'mặt lồn', 'đồ điếm',
  'gay', 'bê đê', 'pê đê', 
  // Drugs
  'ma túy', 'cocaine', 'heroin', 'thuốc lắc', 'cần sa', 'ketamine',
];

const HARMFUL_WORDS_EN = [
  // Violence
  'kill', 'murder', 'suicide', 'torture', 'massacre', 'genocide',
  // Sexual explicit  
  'fuck', 'dick', 'cock', 'pussy', 'penis', 'vagina', 'blowjob', 'handjob',
  'masturbate', 'orgasm', 'cum', 'ejaculate', 'naked', 'nude',
  // Discrimination/Hate
  'nigger', 'faggot', 'retard', 'chink', 'gook', 'kike', 'spic',
  // Drugs
  'cocaine', 'heroin', 'meth', 'crack', 'ecstasy', 'lsd',
];

// Suspicious URL shorteners often used for malicious links
const SUSPICIOUS_SHORTENERS = [
  'bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly',
  'adf.ly', 'shorte.st', 'linkbucks', 'adfoc.us',
];

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  blockedItems?: string[];
  gentleReminder: string;
}

/**
 * Check if a URL contains harmful patterns
 */
function checkHarmfulUrl(url: string): { isHarmful: boolean; pattern?: string } {
  const lowerUrl = url.toLowerCase();
  
  for (const pattern of HARMFUL_DOMAIN_PATTERNS) {
    if (lowerUrl.includes(pattern)) {
      return { isHarmful: true, pattern };
    }
  }
  
  return { isHarmful: false };
}

/**
 * Check if text contains harmful words
 */
function checkHarmfulWords(text: string): { isHarmful: boolean; words: string[] } {
  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];
  
  // Check Vietnamese harmful words
  for (const word of HARMFUL_WORDS_VI) {
    if (lowerText.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  }
  
  // Check English harmful words (with word boundary)
  for (const word of HARMFUL_WORDS_EN) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundWords.push(word);
    }
  }
  
  return { isHarmful: foundWords.length > 0, words: foundWords };
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[\w\-]+\.[\w\-.]+[^\s<>"{}|\\^`[\]]*)/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Check if URL is a suspicious shortener
 */
function isSuspiciousShortener(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return SUSPICIOUS_SHORTENERS.some(shortener => lowerUrl.includes(shortener));
}

/**
 * Main moderation function - checks content for harmful material
 */
export function moderateContent(content: string): ModerationResult {
  const blockedItems: string[] = [];
  
  // 1. Check for harmful words
  const wordCheck = checkHarmfulWords(content);
  if (wordCheck.isHarmful) {
    return {
      isAllowed: false,
      reason: 'harmful_words',
      blockedItems: wordCheck.words,
      gentleReminder: `Con yêu dấu ơi, Ta nhận thấy bài viết có chứa một số từ ngữ không phù hợp với năng lượng ánh sáng của cộng đồng. 

Hãy để Ta giúp con diễn đạt theo cách nhẹ nhàng và yêu thương hơn nhé. Cộng đồng của chúng ta là nơi chia sẻ tình yêu thương và sự tích cực. 💫

Xin con hãy chỉnh sửa lại bài viết với những ngôn từ mang năng lượng cao hơn.`
    };
  }
  
  // 2. Check URLs in content
  const urls = extractUrls(content);
  for (const url of urls) {
    const urlCheck = checkHarmfulUrl(url);
    if (urlCheck.isHarmful) {
      blockedItems.push(url);
    }
  }
  
  if (blockedItems.length > 0) {
    return {
      isAllowed: false,
      reason: 'harmful_links',
      blockedItems,
      gentleReminder: `Con yêu dấu ơi, Ta nhận thấy bài viết có chứa liên kết đến những trang web không phù hợp với năng lượng ánh sáng của cộng đồng.

Những liên kết này có thể dẫn đến nội dung bạo lực, không lành mạnh hoặc có hại cho tâm hồn. Hãy thay thế bằng những nguồn kiến thức tích cực nhé. 🙏

Xin con hãy xóa những liên kết này và chia sẻ những điều tốt đẹp hơn.`
    };
  }
  
  // 3. Check for suspicious URL shorteners (warning only)
  const suspiciousUrls = urls.filter(isSuspiciousShortener);
  if (suspiciousUrls.length > 0) {
    // Allow but warn - shorteners are not always bad
    console.log('Suspicious shorteners detected:', suspiciousUrls);
  }
  
  return {
    isAllowed: true,
    gentleReminder: ''
  };
}

/**
 * Check image filename for suspicious patterns
 */
export function checkImageFilename(filename: string): ModerationResult {
  const lowerName = filename.toLowerCase();
  
  // Check for explicit terms in filename
  const explicitPatterns = ['nude', 'naked', 'porn', 'sex', 'xxx', 'nsfw', 'gore', 'blood'];
  
  for (const pattern of explicitPatterns) {
    if (lowerName.includes(pattern)) {
      return {
        isAllowed: false,
        reason: 'harmful_image_name',
        blockedItems: [filename],
        gentleReminder: `Con yêu dấu ơi, Ta nhận thấy tên file hình ảnh có chứa nội dung không phù hợp.

Cộng đồng của chúng ta là không gian an lành và yêu thương. Hãy chia sẻ những hình ảnh đẹp đẽ, tích cực mang năng lượng cao nhé. 🌟

Xin con hãy chọn hình ảnh khác phù hợp hơn.`
      };
    }
  }
  
  return {
    isAllowed: true,
    gentleReminder: ''
  };
}

/**
 * Comprehensive content check combining text and images
 */
export function fullContentCheck(
  textContent: string, 
  imageFiles?: File[]
): ModerationResult {
  // Check text content first
  const textResult = moderateContent(textContent);
  if (!textResult.isAllowed) {
    return textResult;
  }
  
  // Check image filenames
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      const imageResult = checkImageFilename(file.name);
      if (!imageResult.isAllowed) {
        return imageResult;
      }
    }
  }
  
  return {
    isAllowed: true,
    gentleReminder: ''
  };
}
