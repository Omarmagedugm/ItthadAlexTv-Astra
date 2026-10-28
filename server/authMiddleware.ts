import { getAdminApp, getAdminDatabase } from './firebaseAdmin';
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
// Initialize without ever logging credential material.
try { getAdminApp(); } catch { console.error('[Firebase Admin] Invalid server credential configuration.'); }

// Known verified bootstrap administrator UIDs from database
export const BOOTSTRAP_ADMIN_UIDS = new Set([
  'HRDB2ppkGqOfBrat2D0xThuTkRe2',
  'RrpMWEOls8SfFDQj4CJrLnEF5dr1'
]);

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role?: string;
  roles?: string[];
  isAdmin?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// In-memory cache for user roles (TTL: 60s) to minimize Firestore REST calls
const userRoleCache = new Map<string, { role: string; roles: string[]; expiry: number }>();

/**
 * Fetch a user's role directly from Firestore REST API
 */
export async function getUserRoleFromFirestore(uid: string): Promise<{ role: string; roles: string[] }> {
  if (BOOTSTRAP_ADMIN_UIDS.has(uid)) {
    return { role: 'admin', roles: ['admin'] };
  }

  const cached = userRoleCache.get(uid);
  if (cached && cached.expiry > Date.now()) {
    return { role: cached.role, roles: cached.roles };
  }

  try {
    const snapshot = await getAdminDatabase().doc(`users/${uid}`).get();
    const data = snapshot.data() || {};
    const role = typeof data.role === 'string' ? data.role : 'user';
    const roles = Array.isArray(data.roles) ? data.roles.filter(value => typeof value === 'string') : [];
    userRoleCache.set(uid, { role, roles, expiry: Date.now() + 60000 });
    return { role, roles };
  } catch { return { role: 'user', roles: [] }; }

}

/**
 * Server-side helper to update a user's role securely in Firestore
 */
export async function setUserRoleInFirestore(
  targetUid: string, 
  role: string, 
  roles: string[] = []
): Promise<{ success: boolean; error?: string }> {
  const allowedRoles = [
    'user', 'writer', 'moderator', 'admin', 'superadmin', 
    'news_editor', 'media_editor', 'matches_editor', 
    'store_editor', 'layout_editor', 'user_manager', 'members_editor'
  ];

  if (!allowedRoles.includes(role)) {
    return { success: false, error: `الدور '${role}' غير صالح` };
  }

  if (!roles.every(value => allowedRoles.includes(value))) return { success: false, error: 'Invalid roles' };
  try {
    await getAdminDatabase().doc(`users/${targetUid}`).update({ role, roles });
    userRoleCache.delete(targetUid);
    return { success: true };
  } catch { return { success: false, error: 'Role update unavailable' }; }

}

/**
 * Reusable Authentication Middleware
 * Validates Bearer ID Token cryptographically using Firebase Admin SDK
 */
export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'مطلوب رمز تعريف صالح (Authorization: Bearer <token>) للوصول إلى هذا الرابط' 
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'رمز التعريف مفقود أو غير صالح' });
    }

    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token, true);
    } catch (err: any) {
      console.warn('[Auth Middleware] Invalid/expired token:', err?.code || err?.message);
      return res.status(401).json({ 
        error: 'جلسة تسجيل الدخول منتهية أو غير صالحة. يرجى إعادة تسجيل الدخول.' 
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Unexpected error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء التحقق من الجلسة' });
  }
}

/**
 * Check if a UID or authenticated user has admin privileges
 */
export async function isUserAdmin(uid: string, userClaims?: any): Promise<boolean> {
  if (BOOTSTRAP_ADMIN_UIDS.has(uid)) {
    return true;
  }
  if (userClaims?.admin === true || userClaims?.role === 'admin' || userClaims?.role === 'superadmin') {
    return true;
  }
  const { role, roles } = await getUserRoleFromFirestore(uid);
  return role === 'admin' || role === 'superadmin' || roles.includes('admin') || roles.includes('superadmin');
}

/**
 * Reusable Authorization Middleware: Requires Administrator Role
 * Derives user identity from cryptographically verified token and checks Firestore/Admin authorization
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  await authenticateUser(req, res, async () => {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'غير مصرح: لم يتم التعرف على المستخدم' });
    }

    const uid = req.user.uid;

    // Check bootstrap admin list
    if (BOOTSTRAP_ADMIN_UIDS.has(uid)) {
      req.user.isAdmin = true;
      req.user.role = 'admin';
      return next();
    }

    // Check Firestore user profile for admin role
    const { role, roles } = await getUserRoleFromFirestore(uid);
    req.user.role = role;
    req.user.roles = roles;

    const isAdmin = role === 'admin' || role === 'superadmin' || roles.includes('admin') || roles.includes('superadmin');

    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'غير مصرح: هذه العملية تتطلب صلاحيات المشرف الكاملة (Forbidden)' 
      });
    }

    req.user.isAdmin = true;
    next();
  });
}
