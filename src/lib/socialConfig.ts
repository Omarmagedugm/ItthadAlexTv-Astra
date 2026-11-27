export const FACEBOOK_PAGE_ID = '167590276670763';
export const FACEBOOK_GRAPH_API_VERSION = 'v21.0';
export const FACEBOOK_POSTS_FIELDS = 'message,story,created_time,full_picture,permalink_url';
export const FACEBOOK_POSTS_LIMIT = 20;
export const FACEBOOK_PAGE_URL = 'https://www.facebook.com/itthadalexchannel';
export const FACEBOOK_USERNAME = 'itthadalexchannel';

/**
 * Server-side proxy endpoint that fetches posts from the Facebook Graph API
 * using process.env.FACEBOOK_PAGE_ACCESS_TOKEN so the Page Access Token
 * never enters the client bundle.
 */
export const FACEBOOK_POSTS_API_ENDPOINT = '/api/facebook-posts';

export interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
}

export interface FacebookPostsResponse {
  posts: FacebookPost[];
  fetchedAt: string;
  error?: string;
  message?: string;
}

/**
 * Extracts the postId segment after the underscore from a Graph API post id (`{pageId}_{postId}`).
 */
export function extractFacebookPostId(graphId: string | undefined | null): string | null {
  if (!graphId || typeof graphId !== 'string') return null;
  const trimmed = graphId.trim();
  const underscoreIndex = trimmed.indexOf('_');
  if (underscoreIndex < 0) return null;
  const postId = trimmed.slice(underscoreIndex + 1).trim();
  if (!postId || !/^[A-Za-z0-9._-]+$/.test(postId)) return null;
  return postId;
}

/**
 * Returns true if the URL is a Facebook Video or Reel permalink that already opens reliably.
 */
export function isFacebookVideoOrReelUrl(rawUrl: string | undefined | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (host === 'fb.watch' || host === 'www.fb.watch') {
      return true;
    }
    return (
      path.includes('/reel/') ||
      path.includes('/reels/') ||
      path.includes('/videos/') ||
      path.includes('/video/') ||
      path === '/watch' ||
      path.startsWith('/watch/') ||
      path === '/video.php'
    );
  } catch {
    return false;
  }
}

/**
 * Builds the canonical Facebook post URL:
 * - Preserves video/reel permalinks as-is.
 * - For photo/text posts (including `photo/?fbid=` or broken profile-ID `/posts/` permalinks),
 *   builds `https://www.facebook.com/167590276670763/posts/{postId}` from the Graph post id.
 */
export function resolveFacebookPostUrl(
  graphId: string | undefined | null,
  permalinkUrl: string | undefined | null,
  fallbackUrl: string = FACEBOOK_PAGE_URL
): string {
  const trimmedPermalink = typeof permalinkUrl === 'string' ? permalinkUrl.trim() : '';

  if (trimmedPermalink && isFacebookVideoOrReelUrl(trimmedPermalink)) {
    return trimmedPermalink;
  }

  const postId = extractFacebookPostId(graphId);
  if (postId) {
    return `https://www.facebook.com/${FACEBOOK_PAGE_ID}/posts/${postId}`;
  }

  return trimmedPermalink || fallbackUrl;
}

