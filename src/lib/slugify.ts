/**
 * Remove Vietnamese accents using Unicode NFD normalization.
 */
export function removeVietnameseAccents(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

const MAX_SLUG_LENGTH = 60;

/**
 * Generate a URL-friendly slug from a Vietnamese title.
 * - Removes Vietnamese accents via NFD normalization
 * - Converts to lowercase
 * - Replaces spaces with underscores
 * - Removes special characters
 * - Trims to 60 chars (word boundary)
 * - Falls back to "post" if empty
 */
export function generateSlug(title: string): string {
  if (!title || !title.trim()) return 'post';

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

  if (!slug) return 'post';

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
export function makeUniqueSlug(baseSlug: string, existingSlugs: string[], maxAttempts = 50): string {
  if (!existingSlugs.includes(baseSlug)) return baseSlug;

  // Try _2, _3 ... up to maxAttempts
  for (let i = 2; i <= maxAttempts + 1; i++) {
    const candidate = `${baseSlug}_${i}`;
    if (!existingSlugs.includes(candidate)) return candidate;
  }

  // Fallback: random 4-char suffix (up to 5 attempts)
  for (let i = 0; i < 5; i++) {
    const suffix = Math.random().toString(36).substring(2, 6);
    const candidate = `${baseSlug}_${suffix}`;
    if (!existingSlugs.includes(candidate)) return candidate;
  }

  // Ultimate fallback with timestamp
  return `${baseSlug}_${Date.now().toString(36).slice(-6)}`;
}
