/** All client uploads belong to the authenticated member's namespace. */
export function memberUploadPath(uid: string | undefined, folder: string, filename: string): string {
  if (!uid || uid.includes('/') || uid === '.' || uid === '..') throw new Error('Authentication required');
  const clean = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 100) || 'media';
  return `uploads/${uid}/${clean(folder)}/${clean(filename)}`;
}
