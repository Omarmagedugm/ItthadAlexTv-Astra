import facebookPostsHandler from '../server/facebookPostsHandler.js';

export default async function handler(req: any, res: any) {
  return facebookPostsHandler(req, res);
}
