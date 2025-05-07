import { adminFirestore } from "@/lib/firebase/admin";
import { type NextRequest, NextResponse } from "next/server";

type Params = Promise<{ userId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  console.log("ℹ️ XXX: ~ route.ts ~ request:", request);
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get user profile from Firestore
    const userDoc = await adminFirestore.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();

    // Return user profile data
    return NextResponse.json({
      id: userId,
      username: userData?.username || "",
      createdAt: userData?.createdAt || "",
      lastLoginAt: userData?.lastLoginAt || "",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}
