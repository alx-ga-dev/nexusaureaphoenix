import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ message: 'ID Token is required' }, { status: 400 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    // Create the session cookie.
    const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, { expiresIn });

    // Define cookie options
    const cookieOptions = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    // Return the session cookie in a header.
    const response = NextResponse.json({ message: 'Session cookie set successfully' });
    response.cookies.set(cookieOptions);
    return response;

  } catch (error) {
    console.error('Error creating session cookie:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Session cookie cleared successfully' });
    response.cookies.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}