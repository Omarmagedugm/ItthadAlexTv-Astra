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
