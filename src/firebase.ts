import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  getDocFromServer,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection to Firestore on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Nomadic Lex] Firestore connected successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Nomadic Lex] Please check your Firebase configuration.');
    } else {
      console.log('[Nomadic Lex] Firestore healthcheck ping completed:', error instanceof Error ? error.message : error);
    }
    return false;
  }
}

// Execute connection test
testConnection();

// Authentication helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign In error:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
    throw err;
  }
}

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  academicStage?: string;
  studyStreak?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgressData {
  userId: string;
  courseId: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextTopic?: string;
  updatedAt: string;
}

export interface ActivityData {
  id?: string;
  userId: string;
  title: string;
  meta?: string;
  timestamp: string;
  createdAt: string;
}

export interface BriefData {
  id?: string;
  userId: string;
  caseTitle: string;
  facts?: string;
  issue?: string;
  ruling?: string;
  createdAt: string;
  updatedAt: string;
}

// Sync or fetch user profile from Firestore
export async function syncUserProfile(user: User, customName?: string, stage?: string): Promise<UserProfileData> {
  const userPath = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    const now = new Date().toISOString();

    if (snap.exists()) {
      const data = snap.data() as UserProfileData;
      return data;
    } else {
      const newProfile: UserProfileData = {
        uid: user.uid,
        email: user.email || 'scholar@lawschool.edu',
        displayName: customName || user.displayName || user.email?.split('@')[0] || '1L Scholar',
        academicStage: stage || '1L First-Year Scholar',
        studyStreak: 0,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

// Fetch all course progress records for a user
export async function fetchUserCourseProgress(userId: string): Promise<Record<string, CourseProgressData>> {
  const collectionPath = `users/${userId}/courses`;
  try {
    const colRef = collection(db, 'users', userId, 'courses');
    const snap = await getDocs(colRef);
    const result: Record<string, CourseProgressData> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as CourseProgressData;
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
}

// Update course progress in Firestore
export async function saveUserCourseProgress(userId: string, course: CourseProgressData): Promise<void> {
  const docPath = `users/${userId}/courses/${course.courseId}`;
  try {
    const docRef = doc(db, 'users', userId, 'courses', course.courseId);
    await setDoc(docRef, {
      ...course,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Add user activity in Firestore
export async function logUserActivity(userId: string, activity: Omit<ActivityData, 'userId' | 'createdAt'>): Promise<void> {
  const activityId = `act_${Date.now()}`;
  const docPath = `users/${userId}/activities/${activityId}`;
  try {
    const docRef = doc(db, 'users', userId, 'activities', activityId);
    const newAct: ActivityData = {
      userId,
      title: activity.title,
      meta: activity.meta || '',
      timestamp: activity.timestamp,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newAct);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Save case brief in Firestore
export async function saveUserBrief(userId: string, briefId: string, brief: Omit<BriefData, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const docPath = `users/${userId}/briefs/${briefId}`;
  try {
    const docRef = doc(db, 'users', userId, 'briefs', briefId);
    const now = new Date().toISOString();
    await setDoc(docRef, {
      userId,
      caseTitle: brief.caseTitle,
      facts: brief.facts || '',
      issue: brief.issue || '',
      ruling: brief.ruling || '',
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
