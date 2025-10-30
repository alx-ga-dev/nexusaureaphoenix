
import * as admin from 'firebase-admin';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// A single initialization function to ensure the app is initialized only once.
const initializeFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    try {
      const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountBase64) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
      }
      const serviceAccountJsonString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJsonString);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('[admin.ts] Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('[admin.ts] Firebase Admin initialization error:', error);
      // In a production environment, you might want to throw this error 
      // to prevent the application from starting in a misconfigured state.
    }
  }
  return admin.app(); // Return the initialized app
};

initializeFirebaseAdmin();

// Get the services from the default app and export them with their original names.
const firebaseAdminAuth: Auth = getAuth();
const firebaseAdminFirestore: Firestore = getFirestore();
const firebaseAdminStorage: Storage = getStorage();

export const firebaseAdmin = admin;
export { firebaseAdminAuth, firebaseAdminFirestore, firebaseAdminStorage };
