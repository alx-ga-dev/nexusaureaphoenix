
"use server";

import { firebaseAdminAuth } from "@/lib/firebase-admin";
import { firebaseAdminFirestore } from "@/lib/firebase-admin";

/**
 * Server Action to handle user login and data fetching in a single operation.
 *
 * This function performs the following steps on the server:
 * 1.  It receives a User ID (uid).
 * 2.  It fetches the user's profile data from Firestore.
 * 3.  It uses the Firebase Admin SDK to create a custom authentication token for that uid,
 *     including any claims derived from the user's profile (like `roleLevel`).
 * 4.  It returns both the generated `customToken` and the fetched `userData` to the client.
 *
 * This server-centric approach is highly performant. It consolidates multiple
 * roundtrips (get token, get user data) into a single request/response cycle,
 * eliminating the client-side data fetching waterfall that causes re-renders.
 *
 * @param {string} uid - The user ID to authenticate.
 * @returns {Promise<{ status: "success", customToken: string, userData: any } | { status: "error", message: string }>}
 *          An object containing the result of the operation.
 */
export async function loginAndGetUser(uid: string) {
  if (!uid) {
    return { status: "error" as const, message: "User ID is required." };
  }

  try {
    
    // 1. Fetch user data from Firestore
    const userRef = firebaseAdminFirestore.collection("users").doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    if (!userData) {
      // Handle case where user does not exist in Firestore
      return { status: "error" as const, message: "User not found." };
    }

    // 2. Create custom token with claims
    const claims = { roleLevel: userData.roleLevel || 0 };
    const customToken = await firebaseAdminAuth.createCustomToken(uid, claims);

    // 3. Return both token and user data
    return {
      status: "success" as const,
      customToken,
      userData,
    };
  } catch (error) {
    console.error("[Server Action] Error in loginAndGetUser:", error);
    const message = error instanceof Error ? error.message : "An unknown server error occurred.";
    return { status: "error" as const, message };
  }
}
