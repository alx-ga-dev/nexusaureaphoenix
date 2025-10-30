
'use client';
import '@/lib/firebase';
import { DEFAULT_USER_ID } from '@/lib/constants';

async function fetchCustomToken(type: 'anonymous' | 'manual', uid?: string): Promise<string> {
    let requestBody: { uid?: string } = {};

    if (type === 'anonymous') {
        requestBody.uid = DEFAULT_USER_ID;
    } else if (type === 'manual' && uid) {
        console.debug('Preparing to fetch custom token for uid:', uid);
        requestBody.uid = uid;
    } else {
        throw new Error('Invalid login type or missing uid for manual login');
    }

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch custom token:", errorData);
        throw new Error(errorData.error || 'Failed to fetch custom token from API');
    }

    const { token } = await response.json();
    if (!token) {
        throw new Error('API response did not include a token.');
    }
    return token;
}

/** 
 * Initiates anonymous sign-in by fetching a custom token for the default user.
 * Returns the custom token.
 */
export async function initiateAnonymousSignIn(): Promise<string> {
    try {
        console.log("Initiating anonymous sign-in...");
        const customToken = await fetchCustomToken('anonymous');
        return customToken;
    } catch (error) {
        console.error('Anonymous sign-in failed:', error);
        throw error;
    }
}

/** 
 * Initiates User ID sign-in by fetching a custom token for the given UID.
 * Returns the custom token.
 */
export async function initiateUserIdSignIn(uid: string): Promise<string> {
    if (!uid) {
        throw new Error('User ID is required for manual sign-in.');
    }
    try {
        console.log(`Initiating sign-in for UID: ${uid}...`);
        const customToken = await fetchCustomToken('manual', uid);
        return customToken;
    } catch (error) {
        console.error('User ID sign-in failed:', error);
        throw error;
    }
}