import type { UserProfile } from '../store';
// Match the bootstrap identities authorized by Firestore and the server.
export const BOOTSTRAP_ADMIN_UIDS = new Set(['HRDB2ppkGqOfBrat2D0xThuTkRe2', 'RrpMWEOls8SfFDQj4CJrLnEF5dr1']);
const STAFF_ROLES = new Set(['admin', 'superadmin', 'moderator', 'writer', 'news_editor', 'media_editor', 'matches_editor', 'store_editor', 'layout_editor', 'user_manager', 'members_editor']);
type Identity = Pick<UserProfile, 'uid' | 'role' | 'roles'>;
export function isSuperAdminProfile(profile: Identity): boolean {
  return Boolean(profile.uid && (BOOTSTRAP_ADMIN_UIDS.has(profile.uid) || [profile.role, ...(profile.roles || [])].some(role => role === 'admin' || role === 'superadmin')));
}
export function canAccessAdmin(profile: Identity): boolean {
  return Boolean(profile.uid && (isSuperAdminProfile(profile) || [profile.role, ...(profile.roles || [])].some(role => STAFF_ROLES.has(role))));
}
