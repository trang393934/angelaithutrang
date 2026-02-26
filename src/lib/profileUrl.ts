/**
 * Generate profile path: /{handle} or /user/{userId} (fallback)
 */
export function getProfilePath(userId: string, handle?: string | null): string {
  return handle ? `/${handle}` : `/user/${userId}`;
}

/**
 * Generate post path: /{handle}/post/{slug} or /post/{postId} (fallback)
 */
export function getPostPath(postId: string, slug?: string | null, handle?: string | null): string {
  return handle && slug ? `/${handle}/post/${slug}` : `/post/${postId}`;
}
