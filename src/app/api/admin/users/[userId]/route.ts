
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(userDoc.data());
  } catch (error) {
    console.error("Error retrieving user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { name, type, roleLevel } = await req.json();

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    if (!name || !type || !roleLevel) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await adminDb.collection("users").doc(userId).update({
      name,
      type,
      roleLevel,
    });

    return new NextResponse("User updated successfully", { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
