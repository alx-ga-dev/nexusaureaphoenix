
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { name, type, roleLevel } = await req.json();

    if (!name || !type || !roleLevel) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const userId = uuidv4();
    
    await adminDb.collection("users").doc(userId).set({
      id: userId,
      name,
      type,
      roleLevel,
    });

    return new NextResponse("User created successfully", { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
