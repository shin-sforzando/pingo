import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PARTICIPANTS_PER_GAME } from "@/lib/constants";
import type { Game } from "@/types/schema";
import { GET } from "./route";

// Mock types
type MockGame = Pick<
  Game,
  | "id"
  | "title"
  | "theme"
  | "creatorId"
  | "expiresAt"
  | "isPublic"
  | "isPhotoSharingEnabled"
  | "requiredBingoLines"
  | "confidenceThreshold"
  | "maxSubmissionsPerUser"
  | "status"
  | "createdAt"
> &
  Partial<Omit<Game, "id" | "title" | "theme" | "creatorId" | "expiresAt">>;

// Mock Firebase Admin
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

// Mock Firebase Admin Collections
vi.mock("@/lib/firebase/admin-collections", () => ({
  AdminGameService: {
    getPublicGames: vi.fn(),
  },
  AdminUserService: {
    getUser: vi.fn(),
  },
  AdminGameParticipationService: {
    getParticipantCount: vi.fn(),
  },
}));

describe("GET /api/game/public", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should exclude full games from the list", async () => {
    const { AdminGameService, AdminGameParticipationService } = await import(
      "@/lib/firebase/admin-collections"
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    // Create mock games: one full, one available
    const mockGames: MockGame[] = [
      {
        id: "GAME01",
        title: "Full Game",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "GAME02",
        title: "Available Game",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-02"),
      },
    ];

    vi.mocked(AdminGameService.getPublicGames).mockResolvedValue(mockGames);

    // Mock participant counts: first game is full, second is not
    vi.mocked(AdminGameParticipationService.getParticipantCount)
      .mockResolvedValueOnce(MAX_PARTICIPANTS_PER_GAME) // GAME01 is full
      .mockResolvedValueOnce(15); // GAME02 has 15 participants

    const request = new NextRequest("http://localhost/api/game/public", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.games).toHaveLength(1); // Only non-full game
    expect(data.data.games[0].id).toBe("GAME02"); // Available game
    expect(data.data.games[0].participantCount).toBe(15);
  });

  it("should include all games when none are full", async () => {
    const { AdminGameService, AdminGameParticipationService } = await import(
      "@/lib/firebase/admin-collections"
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const mockGames: MockGame[] = [
      {
        id: "GAME01",
        title: "Game 1",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "GAME02",
        title: "Game 2",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-02"),
      },
    ];

    vi.mocked(AdminGameService.getPublicGames).mockResolvedValue(mockGames);

    // Both games have participants below the limit
    vi.mocked(AdminGameParticipationService.getParticipantCount)
      .mockResolvedValueOnce(10) // GAME01
      .mockResolvedValueOnce(20); // GAME02

    const request = new NextRequest("http://localhost/api/game/public", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.games).toHaveLength(2); // Both games included
    expect(data.data.games[0].id).toBe("GAME02"); // Newest first
    expect(data.data.games[1].id).toBe("GAME01");
  });

  it("should return empty list when all games are full", async () => {
    const { AdminGameService, AdminGameParticipationService } = await import(
      "@/lib/firebase/admin-collections"
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const mockGames: MockGame[] = [
      {
        id: "GAME01",
        title: "Full Game 1",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "GAME02",
        title: "Full Game 2",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-02"),
      },
    ];

    vi.mocked(AdminGameService.getPublicGames).mockResolvedValue(mockGames);

    // All games are full
    vi.mocked(AdminGameParticipationService.getParticipantCount)
      .mockResolvedValueOnce(MAX_PARTICIPANTS_PER_GAME)
      .mockResolvedValueOnce(MAX_PARTICIPANTS_PER_GAME);

    const request = new NextRequest("http://localhost/api/game/public", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.games).toHaveLength(0); // No games available
  });

  it("should sort games by creation date (newest first)", async () => {
    const { AdminGameService, AdminGameParticipationService } = await import(
      "@/lib/firebase/admin-collections"
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const mockGames: MockGame[] = [
      {
        id: "GAME01",
        title: "Oldest Game",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "GAME02",
        title: "Middle Game",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-01-15"),
      },
      {
        id: "GAME03",
        title: "Newest Game",
        theme: "Test Theme",
        creatorId: "creator-id",
        expiresAt: futureDate,
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        maxSubmissionsPerUser: 100,
        status: "active" as const,
        createdAt: new Date("2024-02-01"),
      },
    ];

    vi.mocked(AdminGameService.getPublicGames).mockResolvedValue(mockGames);

    // All games have participants below the limit
    vi.mocked(
      AdminGameParticipationService.getParticipantCount,
    ).mockResolvedValue(5);

    const request = new NextRequest("http://localhost/api/game/public", {
      method: "GET",
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.games).toHaveLength(3);

    // Verify sorting: newest first
    expect(data.data.games[0].id).toBe("GAME03"); // Newest (2024-02-01)
    expect(data.data.games[1].id).toBe("GAME02"); // Middle (2024-01-15)
    expect(data.data.games[2].id).toBe("GAME01"); // Oldest (2024-01-01)
  });
});
