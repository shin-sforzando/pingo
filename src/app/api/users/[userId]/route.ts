import { adminFirestore } from "@/lib/firebase/admin";
import { timestampHelpers } from "@/models/Timestamp";
import { userConverter } from "@/models/User";
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

    // Get user profile from Firestore using the converter
    const userRef = adminFirestore
      .collection("users")
      .doc(userId)
      .withConverter(userConverter);

    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data() as ReturnType<
      typeof userConverter.fromFirestore
    >;

    // Format timestamps for the response
    const formattedUser = {
      id: userData.id,
      username: userData.username,
      createdAt: userData.createdAt
        ? timestampHelpers.format(userData.createdAt)
        : "",
      lastLoginAt: userData.lastLoginAt
        ? timestampHelpers.format(userData.lastLoginAt)
        : "",
    };

    // Return user profile data
    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}
