import { CLOUDINARY_TO_FIRESTORE_MAP } from './cloudinaryToFirestoreMap';

const LOGO_URL_REGEX = /(?:^|\/)(?:icon\.png|favicon\.[^/?#]+|admin_(?:home)?logo\/|(?:7[0-9]|8[0-9])_)|(?:logo|crest|badge|emblem|shield)/i;

/**
 * Identifies whether an image URL points to a club/team/app logo so it is never compressed or downscaled.
 */
export const isLogoUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return LOGO_URL_REGEX.test(url);
};

/**
 * Image URL resolution utility.
 * Prioritizes local/Firestore storage (/storage/migrated/...) over Cloudinary.
 * Strictly preserves logos untouched while optimizing non-logo images for fast delivery.
 */
export const getOptimizedImage = (url: string | undefined | null, width?: number) => {
  if (!url) return '';

  // 1. If it's already a Firestore / local storage URL or relative asset, serve directly
  if (url.startsWith('/storage/') || url.startsWith('/api/images/')) {
    return url;
  }

  // 2. Pass-through for data URLs, blobs, and non-Cloudinary assets
  if (
    url.startsWith('/') ||
    url.startsWith('data:') || 
    url.startsWith('blob:') || 
    url.endsWith('.svg') ||
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('storage.googleapis.com') ||
    url.includes('wikimedia.org') ||
    url.includes('wikipedia.org') ||
    url.includes('ui-avatars.com') ||
    url.includes('lh3.googleusercontent.com')
  ) {
    return url;
  }

  // 3. If it's a legacy Cloudinary URL, resolve it to its local/Firestore storage equivalent
  if (url.includes('cloudinary.com')) {
    // Exact match check
    if (CLOUDINARY_TO_FIRESTORE_MAP[url]) {
      return CLOUDINARY_TO_FIRESTORE_MAP[url];
    }

    // Try finding by path segment (without query or transformations)
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      let cleanPath = parts[1];
      const pathSegments = cleanPath.split('/');
      // Remove transformation tokens if any
      if (pathSegments.length > 1 && (pathSegments[0].includes('q_auto') || pathSegments[0].includes('f_auto') || pathSegments[0].includes('w_') || pathSegments[0].startsWith('c_'))) {
        cleanPath = pathSegments.slice(1).join('/');
      }
      // Strip version number (e.g. v1783876135/...)
      const withoutV = cleanPath.replace(/^v\d+\//, '');
      if (CLOUDINARY_TO_FIRESTORE_MAP[withoutV]) {
        return CLOUDINARY_TO_FIRESTORE_MAP[withoutV];
      }

      // Never compress or downscale logos
      if (isLogoUrl(url) || isLogoUrl(withoutV)) {
        return url;
      }

      // Fast WebP/AVIF auto-format + responsive width for non-logo images
      const transforms = ['f_auto', 'q_auto:good', 'dpr_auto'];
      if (width && width > 0) {
        transforms.push(`w_${width}`, 'c_limit');
      }
      return `${parts[0]}/upload/${transforms.join(',')}/${cleanPath}`;
    }
  }

  // 4. Return URL directly
  return url;
};
