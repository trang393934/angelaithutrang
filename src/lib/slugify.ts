// Vietnamese accent removal map
const VIETNAMESE_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'đ': 'd',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
};

function removeVietnameseAccents(str: string): string {
  return str
    .split('')
    .map(char => VIETNAMESE_MAP[char] || VIETNAMESE_MAP[char.toLowerCase()]?.toUpperCase() || char)
    .join('');
}

const MAX_SLUG_LENGTH = 60;

/**
 * Generate a URL-friendly slug from a Vietnamese title.
 * - Removes Vietnamese accents
 * - Converts to lowercase
 * - Replaces spaces with underscores
 * - Removes special characters
 * - Trims to 60 chars (word boundary)
 */
export function generateSlug(title: string): string {
  if (!title || !title.trim()) return '';

  let slug = removeVietnameseAccents(title.trim());
  slug = slug.toLowerCase();
  // Replace spaces and hyphens with underscores
  slug = slug.replace(/[\s\-]+/g, '_');
  // Remove anything that's not a-z, 0-9, or underscore
  slug = slug.replace(/[^a-z0-9_]/g, '');
  // Collapse multiple underscores
  slug = slug.replace(/_{2,}/g, '_');
  // Remove leading/trailing underscores
  slug = slug.replace(/^_|_$/g, '');

  if (!slug) return '';

  // Trim to max length at word boundary (underscore)
  if (slug.length > MAX_SLUG_LENGTH) {
    const trimmed = slug.substring(0, MAX_SLUG_LENGTH);
    const lastUnderscore = trimmed.lastIndexOf('_');
    slug = lastUnderscore > 10 ? trimmed.substring(0, lastUnderscore) : trimmed;
  }

  return slug;
}

/**
 * Generate a unique slug by appending _2, _3 etc if needed.
 * Caller provides existing slugs for the same user.
 */
export function makeUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) return baseSlug;
  let counter = 2;
  while (existingSlugs.includes(`${baseSlug}_${counter}`)) {
    counter++;
  }
  return `${baseSlug}_${counter}`;
}
