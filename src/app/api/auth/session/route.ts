
import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE_NAME = 'session';

/**
 * Exchanges a client-side Firebase ID token for a server-side session cookie.
 * The ID token is expected in the Authorization header as a Bearer token.
 */
export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization');
    if (!header || !header.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Authorization header is required' }, { status: 401 });
    }
    const idToken = header.split('Bearer ')[1];

    if (!idToken) {
      return NextResponse.json({ message: 'ID Token is required' }, { status: 400 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    // Create the session cookie.
    const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie in the response.
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
    });

    return response;

  } catch (error) {
      console.error('Error creating session cookie:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
  }

/**
 * Clears the server-side session cookie upon user logout.
 */
export async function DELETE(req: NextRequest) {
    try {
        console.log("[/api/auth/session] Clearing session cookie.");
        const response = NextResponse.json({ status: 'success' });
        // Instruct the browser to clear the cookie by setting an expired date.
        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: '',
            expires: new Date(0),
            path: '/',
        });
        return response;
    } catch (error) {
        console.error('Error deleting session cookie:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
