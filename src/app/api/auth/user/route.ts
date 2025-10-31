
import { NextResponse, NextRequest } from 'next/server';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';

async function getUserIdAndProviderFromToken(request: NextRequest): Promise<string | null> {
    console.log('[/api/auth/user] Attempting to verify auth token...');
    const header = request.headers.get('authorization');
    
    if (!header) {
        console.error('[/api/auth/user] Unauthorized: Missing Authorization header.');
        return null;
    }
    
    if (!header.startsWith('Bearer ')) {
        console.error('[/api/auth/user] Unauthorized: Authorization header format is not Bearer.');
        return null;
    }

    const idToken = header.split('Bearer ')[1];
    console.log('[/api/auth/user] FULL ID TOKEN received for verification:', idToken);

    if (!idToken) {
        console.error('[/api/auth/user] Unauthorized: Token is null or undefined.');
        return null;
    }

    try {
        // CORRECT: Using the admin auth service
        const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
        console.log('[/api/auth/user] Successfully verified ID Token for UID:', decodedToken.uid);

        return decodedToken.uid;
    } catch (error) {
        console.error('[/api/auth/user] CRITICAL: Error verifying auth token:', error);
        if (error instanceof Error && 'code' in error) {
            console.error('[/api/auth/user] Firebase Error Code:', (error as any).code);
        }
        return null;
    }
}


export async function GET(request: NextRequest) {
    console.log('[/api/auth/user] GET request received.');
    try {
        const tokenInfo = await getUserIdAndProviderFromToken(request);
        if (!tokenInfo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const uid = tokenInfo;

        console.log(`[/api/auth/user] Fetching user data for UID: ${uid}`);
        const userRef = firebaseAdminFirestore.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            console.error(`[/api/auth/user] User not found in Firestore for UID: ${uid}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const userData = userSnap.data();

        if (!userData) {
            console.error(`[/api/auth/user] User data is missing in Firestore for UID: ${uid}`);
            return NextResponse.json({ error: 'User data is missing' }, { status: 500 });
        }

        console.log(`[/api/auth/user] Successfully fetched user data for UID: ${uid}`);
        return NextResponse.json({ id: userSnap.id, ...userData });

    } catch (error) {
        console.error('[/api/auth/user] Internal Server Error while fetching user:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
