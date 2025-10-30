
import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    let customToken: string;
    try {
      const userRef = firebaseAdminFirestore.collection('users').doc(uid);
      const userDoc = await userRef.get();

      let roleLevel = 0;
      if (userDoc.exists) {
        roleLevel = userDoc.data()?.roleLevel || 0;
      }

      customToken = await firebaseAdminAuth.createCustomToken(uid, { roleLevel });

    } catch (error) {
        const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
        console.error(`[api/auth/login] Error processing user ${uid}:`, errorMessage);
        // We can be a bit more specific with the error for the client.
        return NextResponse.json({ error: 'Error retrieving user data or creating token.' }, { status: 500 });
    }

    return NextResponse.json({ token: customToken });

  } catch (error) {
    // This will catch errors from req.json() or other unexpected issues.
    console.error('[api/auth/login] An unexpected error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
