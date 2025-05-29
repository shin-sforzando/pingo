import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import type { ApiResponse } from "@/types/common";
import { eventFromFirestore, eventToFirestore } from "@/types/game";
import { type Event, eventSchema } from "@/types/schema";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ulid } from "ulid";

/**
 * Authenticate user from request headers
 * Returns userId if authentication succeeds, or NextResponse with error if it fails
 */
async function authenticateUser(
  request: NextRequest,
): Promise<string | NextResponse<ApiResponse<never>>> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing authentication token",
        },
      },
      { status: 401 },
    );
  }

  const token = authHeader.substring(7);
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken.uid;
}

/**
 * Verify that a game exists and user is a participant
 * Returns null if verification succeeds, or NextResponse with error if it fails
 */
async function verifyGameParticipant(
  gameId: string,
  userId: string,
): Promise<NextResponse<ApiResponse<never>> | null> {
  // Verify game exists
  const gameRef = adminFirestore.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();

  if (!gameDoc.exists) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GAME_NOT_FOUND",
          message: "Game not found",
        },
      },
      { status: 404 },
    );
  }

  // Check if user is participant in this game
  const participantRef = adminFirestore
    .collection("games")
    .doc(gameId)
    .collection("participants")
    .doc(userId);

  const participantDoc = await participantRef.get();
  if (!participantDoc.exists) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_PARTICIPANT",
          message: "User is not a participant in this game",
        },
      },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Get events for a game
 * Only allows participants to view events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<Event[]>>> {
  try {
    const { gameId } = await params;

    // Validate parameters
    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID is required",
          },
        },
        { status: 400 },
      );
    }

    // Verify authentication
    const authResult = await authenticateUser(request);
    if (typeof authResult !== "string") {
      return authResult;
    }
    const userId = authResult;

    // Verify game exists and user is participant
    const verificationError = await verifyGameParticipant(gameId, userId);
    if (verificationError) {
      return verificationError;
    }

    // Get query parameters
    const url = new URL(request.url);
    const eventType = url.searchParams.get("type");
    const userIdFilter = url.searchParams.get("userId");
    const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10);

    // Build query
    let query = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("events")
      .orderBy("timestamp", "desc");

    // Filter by event type if specified
    if (eventType) {
      query = query.where("type", "==", eventType);
    }

    // Filter by user if specified
    if (userIdFilter) {
      query = query.where("userId", "==", userIdFilter);
    }

    // Apply pagination
    if (0 < offset) {
      const offsetSnapshot = await query.limit(offset).get();
      if (offsetSnapshot.empty) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }

    query = query.limit(limit);

    // Execute query
    const eventsSnapshot = await query.get();

    // Convert to Event objects
    const events: Event[] = [];
    for (const doc of eventsSnapshot.docs) {
      const eventData = doc.data();
      const event = eventFromFirestore({
        id: eventData.id,
        type: eventData.type,
        userId: eventData.userId,
        timestamp: eventData.timestamp,
        details: eventData.details,
        createdAt: eventData.createdAt,
        updatedAt: eventData.updatedAt,
      });
      events.push(event);
    }

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to get events",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}

/**
 * Create a new event for a game
 * Only allows participants to create events
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse<ApiResponse<Event>>> {
  try {
    const { gameId } = await params;

    // Validate parameters
    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMS",
            message: "Game ID is required",
          },
        },
        { status: 400 },
      );
    }

    // Verify authentication
    const authResult = await authenticateUser(request);
    if (typeof authResult !== "string") {
      return authResult;
    }
    const userId = authResult;

    // Parse request body
    const body = await request.json();

    // Schema for creating event - reuse from schema.ts
    const createEventSchema = eventSchema.pick({
      type: true,
      details: true,
    });

    const validationResult = createEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid input data",
            details: validationResult.error.errors,
          },
        },
        { status: 400 },
      );
    }

    const { type, details } = validationResult.data;

    // Verify game exists and user is participant
    const verificationError = await verifyGameParticipant(gameId, userId);
    if (verificationError) {
      return verificationError;
    }

    // Create event
    const eventId = ulid();
    const now = new Date();

    const event: Event = {
      id: eventId,
      type,
      userId,
      timestamp: now,
      details: details || {},
      createdAt: now,
      updatedAt: null,
    };

    // Save event to Firestore
    const eventRef = adminFirestore
      .collection("games")
      .doc(gameId)
      .collection("events")
      .doc(eventId);

    const eventDoc = eventToFirestore(event);
    await eventRef.set(eventDoc);

    console.log(
      `Created event: ${eventId} for game: ${gameId} by user: ${userId}`,
    );

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to create event",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
  }
}
