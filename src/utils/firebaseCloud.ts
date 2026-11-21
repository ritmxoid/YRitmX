import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SavedFolderEntry, SavedUrlEntry } from '../types/audio';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Validation Synchronicity with firebase-blueprint.json & firestore.rules
export const MAX_AUDIUS_HANDLE_LENGTH = 100;
export const MAX_URL_LENGTH = 2048;
export const MAX_LABEL_LENGTH = 200;
export const MAX_FOLDER_NAME_LENGTH = 200;
export const AUDIUS_HANDLE_PATTERN = /^[a-zA-Z0-9_.\-]+$/;
export const URL_PATTERN = /^https?:\/\/[\s\S]+/;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: Array<{
      providerId?: string | null;
      email?: string | null;
    }>;
  };
}

export interface CloudUserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

function hashKey(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function toAudiusDocId(handle: string): string {
  return `audius_${hashKey(handle.trim().toLowerCase())}`;
}

export function toUrlDocId(entry: Pick<SavedUrlEntry, 'id' | 'url'>): string {
  if (/^[a-zA-Z0-9_\-]{1,128}$/.test(entry.id)) {
    return entry.id;
  }
  return `url_${hashKey(entry.url.trim())}`;
}

export function toFolderDocId(folder: Pick<SavedFolderEntry, 'id' | 'name'>): string {
  if (/^[a-zA-Z0-9_\-]{1,128}$/.test(folder.id)) {
    return folder.id;
  }
  return `folder_${hashKey(folder.name.trim())}`;
}

function toCloudUserInfo(user: User | null): CloudUserInfo | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    emailVerified: Boolean(user.emailVerified),
  };
}

export function subscribeCloudAuth(cb: (user: CloudUserInfo | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    cb(toCloudUserInfo(user));
  });
}

export async function signInWithGoogleCloud(): Promise<CloudUserInfo | null> {
  if (auth.currentUser) {
    return toCloudUserInfo(auth.currentUser);
  }
  const cred = await signInWithPopup(auth, googleProvider);
  return toCloudUserInfo(cred.user);
}

export async function signInWithEmailCloud(
  email: string,
  password: string
): Promise<CloudUserInfo | null> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return toCloudUserInfo(cred.user);
}

export async function registerWithEmailCloud(
  email: string,
  password: string
): Promise<CloudUserInfo | null> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return toCloudUserInfo(cred.user);
}

export async function sendPasswordResetCloud(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutCloud(): Promise<void> {
  await signOut(auth);
}

async function ensureUserWorkspace(uid: string): Promise<void> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  let exists = false;
  try {
    const snap = await getDoc(userRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (!exists) {
    try {
      await setDoc(userRef, {
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  }
}

export interface CloudMediaSourcesSnapshot {
  audiusProfiles: Array<{ handle: string; isActive: boolean; addedAt: number }>;
  urlEntries: SavedUrlEntry[];
  activeUrlId: string | null;
  folderBookmarks: SavedFolderEntry[];
}

export async function fetchCloudMediaSources(
  uid: string
): Promise<CloudMediaSourcesSnapshot> {
  const audiusPath = `users/${uid}/audiusProfiles`;
  const urlPath = `users/${uid}/urlSources`;
  const folderPath = `users/${uid}/folderBookmarks`;

  const audiusProfiles: Array<{ handle: string; isActive: boolean; addedAt: number }> = [];
  const urlEntries: SavedUrlEntry[] = [];
  const folderBookmarks: SavedFolderEntry[] = [];
  let activeUrlId: string | null = null;

  try {
    const audiusSnap = await getDocs(
      query(collection(db, 'users', uid, 'audiusProfiles'), where('ownerId', '==', uid))
    );
    audiusSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (typeof data.handle === 'string' && data.handle.trim()) {
        audiusProfiles.push({
          handle: data.handle.trim(),
          isActive: Boolean(data.isActive),
          addedAt: typeof data.addedAt === 'number' ? data.addedAt : 0,
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, audiusPath);
  }

  try {
    const urlSnap = await getDocs(
      query(collection(db, 'users', uid, 'urlSources'), where('ownerId', '==', uid))
    );
    urlSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (typeof data.url === 'string' && URL_PATTERN.test(data.url)) {
        const entry: SavedUrlEntry = {
          id: docSnap.id,
          url: data.url,
          label:
            typeof data.label === 'string' && data.label.trim()
              ? data.label.trim()
              : 'URL',
          addedAt: typeof data.addedAt === 'number' ? data.addedAt : Date.now(),
        };
        urlEntries.push(entry);
        if (data.isActive) {
          activeUrlId = docSnap.id;
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, urlPath);
  }

  try {
    const folderSnap = await getDocs(
      query(collection(db, 'users', uid, 'folderBookmarks'), where('ownerId', '==', uid))
    );
    folderSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (typeof data.name === 'string' && data.name.trim()) {
        folderBookmarks.push({
          id: docSnap.id,
          name: data.name.trim(),
          trackCount: typeof data.trackCount === 'number' ? data.trackCount : 0,
          addedAt: typeof data.addedAt === 'number' ? data.addedAt : Date.now(),
          hasDirectoryHandle: false,
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, folderPath);
  }

  audiusProfiles.sort((a, b) => b.addedAt - a.addedAt);
  urlEntries.sort((a, b) => b.addedAt - a.addedAt);
  folderBookmarks.sort((a, b) => b.addedAt - a.addedAt);

  return {
    audiusProfiles,
    urlEntries,
    activeUrlId,
    folderBookmarks,
  };
}

export async function saveCloudMediaSources(
  uid: string,
  payload: {
    audiusProfiles: string[];
    activeHandle: string;
    urlEntries: SavedUrlEntry[];
    activeUrlId: string | null;
    folderEntries?: SavedFolderEntry[];
  }
): Promise<void> {
  await ensureUserWorkspace(uid);

  const audiusColPath = `users/${uid}/audiusProfiles`;
  const urlColPath = `users/${uid}/urlSources`;
  const folderColPath = `users/${uid}/folderBookmarks`;

  const existingAudiusIds = new Set<string>();
  const existingUrlIds = new Set<string>();
  const existingFolderIds = new Set<string>();

  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'audiusProfiles'), where('ownerId', '==', uid))
    );
    snap.forEach((d) => existingAudiusIds.add(d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, audiusColPath);
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'urlSources'), where('ownerId', '==', uid))
    );
    snap.forEach((d) => existingUrlIds.add(d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, urlColPath);
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'folderBookmarks'), where('ownerId', '==', uid))
    );
    snap.forEach((d) => existingFolderIds.add(d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, folderColPath);
  }

  const batch = writeBatch(db);
  const now = Date.now();
  let ops = 0;

  // Sanitize and constrain payloads strictly matching firebase-blueprint.json
  const activeHandleLower = payload.activeHandle.trim().toLowerCase();
  payload.audiusProfiles.forEach((rawHandle, idx) => {
    const handle = rawHandle.trim().replace(/^@+/, '').slice(0, MAX_AUDIUS_HANDLE_LENGTH);
    if (!handle || !AUDIUS_HANDLE_PATTERN.test(handle)) return;
    const docId = toAudiusDocId(handle);
    const ref = doc(db, 'users', uid, 'audiusProfiles', docId);
    const isActive = handle.toLowerCase() === activeHandleLower;
    const addedAt = Math.max(0, now - idx);
    if (existingAudiusIds.has(docId)) {
      batch.update(ref, {
        handle,
        isActive,
        addedAt,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(ref, {
        ownerId: uid,
        handle,
        isActive,
        addedAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    ops++;
  });

  payload.urlEntries.forEach((entry) => {
    const url = entry.url.trim().slice(0, MAX_URL_LENGTH);
    if (url.length < 4 || !URL_PATTERN.test(url)) return;
    const label = (entry.label.trim() || 'URL').slice(0, MAX_LABEL_LENGTH);
    const docId = toUrlDocId({ id: entry.id, url });
    const ref = doc(db, 'users', uid, 'urlSources', docId);
    const isActive = Boolean(payload.activeUrlId && payload.activeUrlId === entry.id);
    const addedAt = typeof entry.addedAt === 'number' && entry.addedAt >= 0 ? entry.addedAt : now;
    if (existingUrlIds.has(docId)) {
      batch.update(ref, {
        url,
        label,
        isActive,
        addedAt,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(ref, {
        ownerId: uid,
        url,
        label,
        isActive,
        addedAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    ops++;
  });

  if (payload.folderEntries) {
    payload.folderEntries.forEach((folder) => {
      const name = folder.name.trim().slice(0, MAX_FOLDER_NAME_LENGTH);
      if (!name) return;
      const docId = toFolderDocId(folder);
      const ref = doc(db, 'users', uid, 'folderBookmarks', docId);
      const trackCount = Math.max(0, Math.min(50000, Math.round(folder.trackCount || 0)));
      const addedAt =
        typeof folder.addedAt === 'number' && folder.addedAt >= 0 ? folder.addedAt : now;
      if (existingFolderIds.has(docId)) {
        batch.update(ref, {
          name,
          trackCount,
          addedAt,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(ref, {
          ownerId: uid,
          name,
          trackCount,
          addedAt,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      ops++;
    });
  }

  if (ops === 0) return;

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function deleteCloudSourceItem(
  uid: string,
  kind: 'audius' | 'url' | 'folder',
  docId: string
): Promise<void> {
  if (!/^[a-zA-Z0-9_\-]{1,128}$/.test(docId)) return;
  const subcol =
    kind === 'audius'
      ? 'audiusProfiles'
      : kind === 'url'
      ? 'urlSources'
      : 'folderBookmarks';
  const path = `users/${uid}/${subcol}/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, subcol, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
