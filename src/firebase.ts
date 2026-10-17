// Firebase configuration & helpers
// Initializes Firebase App, Auth (Google Sign-In), and Firestore.

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Edition, EditionItem, SavedArticleRecord, UserProfile } from '../shared/types.ts';

// ---------------------------------------------------------------------------
// Firebase Config
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyANZsOAxo8CvAvXLzVe_LzAUfd1p_yIfck",
  authDomain: "hackathon-d7f9c.firebaseapp.com",
  projectId: "hackathon-d7f9c",
  storageBucket: "hackathon-d7f9c.firebasestorage.app",
  messagingSenderId: "646097993997",
  appId: "1:646097993997:web:e41a931303e74385e9f044",
  measurementId: "G-1SF3DHTQWN",
};

// ---------------------------------------------------------------------------
// Initialize Firebase
// ---------------------------------------------------------------------------
const app = initializeApp(firebaseConfig);

// Analytics – only in browser environments that support it
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

// Auth
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore
const db = getFirestore(app);

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Sign in with Google popup */
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/** Sign out the current user */
export async function signOutUser() {
  return signOut(auth);
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Firestore helpers & Timeout Error Handling
// ---------------------------------------------------------------------------

export class FirestoreTimeoutError extends Error {
  constructor(operation: string, ms: number) {
    super(`Firestore operation "${operation}" timed out after ${ms}ms`);
    this.name = 'FirestoreTimeoutError';
  }
}

// Bounded timeout for read operations (returns fallback on timeout to avoid hanging UI)
function withReadTimeout<T>(promise: Promise<T>, ms = 2000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise])
    .catch(() => fallback)
    .finally(() => clearTimeout(timer));
}

// Strict timeout for write operations: THROWS if operation hangs or fails so callers
// NEVER treat uncommitted or timed-out writes as success.
function withWriteTimeout<T>(promise: Promise<T>, ms = 3000, label = 'write'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new FirestoreTimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

/** Fetch user profile from Firestore. Returns null if not found or timed out. */
export async function getUserProfileFromFirestore(
  uid: string,
): Promise<UserProfile | null> {
  try {
    const snap = await withReadTimeout(getDoc(doc(db, 'users', uid)), 2000, null);
    if (snap && snap.exists && snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    return null;
  }
}

function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/** Save (merge) user profile to Firestore. Throws on timeout or permission error. */
export async function saveUserProfileToFirestore(
  uid: string,
  profile: Partial<UserProfile>,
): Promise<void> {
  const cleaned = cleanForFirestore({ ...profile, updatedAt: new Date().toISOString() });
  await withWriteTimeout(setDoc(doc(db, 'users', uid), cleaned, { merge: true }), 3000, 'saveUserProfile');
}

// ---------------------------------------------------------------------------
// Firestore helpers – Saved Stories
// ---------------------------------------------------------------------------

/** Get all saved stories for a user */
export async function getUserSavedStoriesFromFirestore(
  uid: string,
): Promise<SavedArticleRecord[]> {
  try {
    const colRef = collection(db, 'users', uid, 'savedStories');
    const q = query(colRef, orderBy('savedAt', 'desc'));
    const snap = await withReadTimeout(getDocs(q), 2000, null);
    if (!snap || !snap.docs) return [];
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedArticleRecord);
  } catch (err) {
    return [];
  }
}

/** Save a story to user's Firestore collection. Throws on timeout or failure. */
export async function saveStoryToFirestore(
  uid: string,
  item: EditionItem,
): Promise<void> {
  const record: SavedArticleRecord = {
    id: item.id,
    userId: uid,
    articleId: item.articleId,
    item,
    savedAt: new Date().toISOString(),
  };
  await withWriteTimeout(setDoc(doc(db, 'users', uid, 'savedStories', item.id), record), 3000, 'saveStory');
}

/** Remove a story from user's Firestore collection. Throws on timeout or failure. */
export async function removeStoryFromFirestore(
  uid: string,
  storyId: string,
): Promise<void> {
  await withWriteTimeout(deleteDoc(doc(db, 'users', uid, 'savedStories', storyId)), 3000, 'removeStory');
}

// ---------------------------------------------------------------------------
// Firestore helpers – Editions
// ---------------------------------------------------------------------------

/** Get all editions for a user (archive) */
export async function getUserEditionsFromFirestore(
  uid: string,
): Promise<Edition[]> {
  try {
    const colRef = collection(db, 'users', uid, 'editions');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await withReadTimeout(getDocs(q), 2000, null);
    if (!snap || !snap.docs) return [];
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Edition);
  } catch (err) {
    return [];
  }
}

/** Save an edition to user's Firestore collection. Throws on timeout or failure. */
export async function saveEditionToFirestore(
  uid: string,
  edition: Edition,
): Promise<void> {
  const cleaned = cleanForFirestore(edition);
  await withWriteTimeout(setDoc(doc(db, 'users', uid, 'editions', edition.id), cleaned), 3000, 'saveEdition');
}
