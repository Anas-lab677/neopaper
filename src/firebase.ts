import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Edition, EditionItem, InteractionRecord, SavedArticleRecord, UserProfile } from '../shared/types.ts';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
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

// Connection test on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection to Firestore established successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline. Please check your network or Firebase configuration.');
    } else {
      console.log('[Firebase] Connection test acknowledged.');
    }
  }
}

// Google Sign-In with popup
export async function signInWithGoogle(): Promise<User> {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

// Sign-Out
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Firestore: User Profile
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfileToFirestore(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const path = `users/${userId}`;
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Firestore: Saved Stories (Personal Library)
export async function getUserSavedStoriesFromFirestore(userId: string): Promise<SavedArticleRecord[]> {
  const path = `users/${userId}/savedStories`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'savedStories'));
    const results: SavedArticleRecord[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        userId,
        articleId: data.articleId || docSnap.id,
        item: data.item || (data as any),
        savedAt: data.savedAt || new Date().toISOString(),
      });
    });
    return results.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveStoryToFirestore(userId: string, item: EditionItem): Promise<void> {
  const path = `users/${userId}/savedStories/${item.id}`;
  try {
    const docData = {
      id: item.id,
      articleId: item.articleId,
      headline: item.headline,
      publisher: item.publisher,
      section: item.section,
      sourceUrl: item.sourceUrl,
      imageUrl: item.imageUrl || '',
      publishedAt: item.publishedAt,
      briefSummary: item.briefSummary,
      savedAt: new Date().toISOString(),
      item,
    };
    await setDoc(doc(db, 'users', userId, 'savedStories', item.id), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeStoryFromFirestore(userId: string, itemId: string): Promise<void> {
  const path = `users/${userId}/savedStories/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'savedStories', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Firestore: Editions (Snapshots & History)
export async function getUserEditionsFromFirestore(userId: string): Promise<Edition[]> {
  const path = `users/${userId}/editions`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'editions'));
    const results: Edition[] = [];
    snap.forEach(docSnap => {
      results.push(docSnap.data() as Edition);
    });
    return results.sort((a, b) => new Date(b.editionDate).getTime() - new Date(a.editionDate).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveEditionToFirestore(userId: string, edition: Edition): Promise<void> {
  const path = `users/${userId}/editions/${edition.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'editions', edition.id), edition);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Firestore: Feedback & Interactions
export async function saveInteractionToFirestore(userId: string, record: InteractionRecord): Promise<void> {
  const path = `users/${userId}/interactions/${record.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'interactions', record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
