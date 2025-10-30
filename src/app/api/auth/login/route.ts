import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    var customToken = null;
    try {
      // Fetch user document from Firestore
      const userDoc = await firebaseAdminFirestore.collection('users').doc(uid).get();

      let roleLevel = 0;
      if (userDoc.exists) {
        roleLevel = userDoc.data()?.roleLevel || 0;
      }
  
      // Create custom token with custom claim
      try {
        customToken = await firebaseAdminAuth.createCustomToken(uid, { roleLevel: roleLevel });
      } catch (error: any) {
        const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
        console.error("[api/auth/login] Error creating custom token:", errorMessage);
        console.error("[api/auth/login] Could not create custom token for user: ", uid);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    } catch (error: any) {
      const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
      console.error("[api/auth/login] Error retrieving user data:", errorMessage);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ token: customToken });

  } catch (error) {
    console.error('Error creating custom token:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}