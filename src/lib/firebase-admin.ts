
import * as admin from 'firebase-admin';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let firebaseAdminAuth: Auth;
let firebaseAdminFirestore: Firestore;
let firebaseAdminStorage: Storage;

if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountBase64) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set');
    }
    const serviceAccountJsonString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJsonString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('[admin.ts] Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('[admin.ts] Firebase Admin initialization error', error);
  }
}

// Only attempt to get services if an app has been initialized
if (admin.apps.length > 0) {
  firebaseAdminAuth = getAuth();
  firebaseAdminFirestore = getFirestore();
  firebaseAdminStorage = getStorage();
} else {
  console.error('[admin.ts] CRITICAL: No Firebase app initialized. Admin services will be unavailable.');
}

export const firebaseAdmin = admin;
export { firebaseAdminAuth, firebaseAdminFirestore, firebaseAdminStorage };