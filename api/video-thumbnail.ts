import videoThumbnailHandler from '../server/videoThumbnailHandler.js';

export default async function handler(req: any, res: any) {
  return videoThumbnailHandler(req, res);
}
