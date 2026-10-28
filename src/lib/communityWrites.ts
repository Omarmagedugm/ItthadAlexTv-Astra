import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
export async function toggleCommunityMembership(collection: string, id: string, listField: string, countField: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Authentication required');
  return runTransaction(db, async transaction => {
    const ref = doc(db, collection, id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Document missing');
    const before = Array.isArray(snapshot.data()[listField]) ? [...new Set<string>(snapshot.data()[listField])] : [];
    const after = before.includes(uid) ? before.filter(value => value !== uid) : [...before, uid];
    const update = { [listField]: after, [countField]: after.length };
    transaction.update(ref, update);
    return update;
  });
}
export async function changeCommunityEntry(collection: string, id: string, listField: string, countField: string, entry: any, remove = false) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Authentication required');
  return runTransaction(db, async transaction => {
    const ref = doc(db, collection, id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Document missing');
    const before: any[] = snapshot.data()[listField] || [];
    const after = remove ? before.filter(value => value.id !== entry.id) : before.some(value => value.id === entry.id) ? before : [...before, { ...entry, userId: uid }];
    const update = { [listField]: after, [countField]: after.length };
    transaction.update(ref, update);
    return update;
  });
}
