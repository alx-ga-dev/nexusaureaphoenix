
import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const customToken = await admin.auth().createCustomToken(userId);

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error("Error creating custom token:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
