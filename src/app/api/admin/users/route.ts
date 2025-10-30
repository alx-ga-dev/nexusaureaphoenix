
import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { userIsAdminFromToken } from "@/lib/auth-tools"

export async function POST(req: NextRequest) {
  try {
    const requesterIsAdmin = await userIsAdminFromToken(req);
    if (!requesterIsAdmin) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, roleLevel } = await req.json();

    if (!name || !type || !roleLevel) {
      return NextResponse.json({ message: 'Name, type and role level are required' }, { status: 400 });
    }

    // 1. Set custom claims for user role
    const customClaims = { roleLevel };

    // 2. Create token for user in Firebase Authentication
    firebaseAdminAuth.createCustomToken(name, customClaims)
    .then(async (customToken) => {
      console.log("Custom token created:", customToken);
      
      // Get UID from the token created
      const decodedToken = await firebaseAdminAuth.verifyIdToken(customToken);
      const uid = decodedToken.uid;

      // 3. Create user document in Firestore with the same UID
      const userRef = firebaseAdminFirestore.collection('users').doc(uid);
      const newUser = {
        id: uid,
        name,
        type,
        roleLevel,
      };
      userRef.set(newUser);

      return NextResponse.json(newUser, { status: 201 });
    })
    .catch((error: any) => {
      const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
      console.error("Error creating custom token:", errorMessage);
      return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    // Provide more specific error messages if possible
    const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}