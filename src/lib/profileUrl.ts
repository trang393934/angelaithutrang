export function getProfilePath(userId: string, handle?: string | null): string {
  return handle ? `/user/${handle}` : `/user/${userId}`;
}
