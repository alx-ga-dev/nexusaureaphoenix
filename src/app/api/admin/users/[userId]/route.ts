
import { NextResponse, NextRequest } from "next/server";
import { firebaseAdminAuth, firebaseAdminFirestore } from "@/lib/firebase-admin";
import { userIsAuthenticated, userIsAdminFromToken } from "@/lib/auth-tools"

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const requesterIsAuth = await userIsAuthenticated(req);
    if (!requesterIsAuth) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const userId = params.userId;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const userDoc = await firebaseAdminFirestore.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(userDoc.data());

  } catch (error: any) {
    console.error('[api/admin/users/[userId] GET] Error retrieving user:', error);
    const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const requesterIsAdmin = await userIsAdminFromToken(req);
    if (!requesterIsAdmin) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const { name, type, roleLevel } = await req.json();

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    if (!name || !type || !roleLevel) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await firebaseAdminFirestore.collection("users").doc(userId).update({
      name,
      type,
      roleLevel,
    });

    await firebaseAdminAuth.setCustomUserClaims(userId, { roleLevel: roleLevel });

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[api/admin/users/[userId] PUT] Error updating user:', error);
    const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const requesterIsAdmin = await userIsAdminFromToken(req);
    if (!requesterIsAdmin) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // 1. Delete from Firebase Authentication
    await firebaseAdminAuth.deleteUser(userId);
    await firebaseAdminAuth.revokeRefreshTokens(userId)
    .then(async () => {
      console.log(`[api/admin/users/[userId] DELETE] Successfully revoked refresh tokens for user ${userId}`);
      // The user's sessions are now invalid, and they will be logged out.
      // 2. Delete from Firestore
      const userRef = firebaseAdminFirestore.collection('users').doc(userId);
      await userRef.delete();

      return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    })
    .catch((error: any) => {
      console.error("[api/admin/users/[userId] DELETE] Error revoking refresh tokens:", error);
      const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
      return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    });

  } catch (error: any) {
    console.error('[api/admin/users/[userId] DELETE] Error deleting user from fireStorage:', error);
    const errorMessage = (error instanceof Error ? error.message : String(error)) || 'An unknown server error occurred.';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}