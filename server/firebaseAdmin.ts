import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../firebase-applet-config.json';

export function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const account = raw ? JSON.parse(raw) : undefined;
  if (account && account.project_id !== config.projectId) throw new Error('Firebase project mismatch');
  return admin.initializeApp({ projectId: config.projectId, ...(account ? { credential: admin.credential.cert(account) } : {}) });
}
export function getAdminDatabase() {
  return getFirestore(getAdminApp(), config.firestoreDatabaseId || '(default)');
}
