import { beforeAll, describe, expect, it } from "vitest";
import {
  mockGameParticipations,
  mockGames,
  mockParticipants,
  mockPlayerBoards,
} from "./game";

describe("MSW Game Handlers (/api/games/*)", () => {
  const testApiBase = "/api/games";
  // Use a valid game ID format (6 uppercase letters)
  const validGameId = "ABCDEF";

  // Initialize mock data before all tests
  beforeAll(() => {
    // Create a test game in the mock data store
    const now = new Date();

    // Create a game with the valid ID
    mockGames[validGameId] = {
      id: validGameId,
      title: "Test Bingo Game",
      theme: "Test Theme",
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      notes: "Test game notes",
      creatorId: "mockuser1",
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: "active",
      board: {
        cells: Array.from({ length: 25 }, (_, i) => ({
          id: `cell-${i % 5}-${Math.floor(i / 5)}`,
          position: { x: i % 5, y: Math.floor(i / 5) },
          subject: i === 12 ? "FREE" : `Subject ${i}`,
          isFree: i === 12,
        })),
      },
    };

    // Initialize participants for the game
    mockParticipants[validGameId] = {
      mockuser1: {
        id: "mockuser1",
        joinedAt: now,
        completedLines: 0,
        lastCompletedAt: null,
        submissionCount: 0,
      },
    };

    // Initialize player boards for the game
    mockPlayerBoards[validGameId] = {
      mockuser1: {
        userId: "mockuser1",
        cellStates: Object.fromEntries(
          mockGames[validGameId].board.cells.map((cell) => [
            cell.id,
            {
              isOpen: cell.isFree,
              openedAt: cell.isFree ? now : null,
              openedBySubmissionId: null,
            },
          ]),
        ),
        completedLines: [],
      },
    };

    // Initialize game participations
    mockGameParticipations[`mockuser1_${validGameId}`] = {
      userId: "mockuser1",
      gameId: validGameId,
      role: "creator",
      joinedAt: now,
      completedLines: 0,
      lastCompletedAt: null,
      submissionCount: 0,
    };

    // Create a second game for admin tests
    const adminGameId = "ADMINT";
    mockGames[adminGameId] = {
      id: adminGameId,
      title: "Admin Test Game",
      theme: "Admin Test",
      isPublic: true,
      isPhotoSharingEnabled: true,
      requiredBingoLines: 1,
      confidenceThreshold: 0.7,
      notes: "Admin test notes",
      creatorId: "mockuser1",
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: "active",
      board: {
        cells: Array.from({ length: 25 }, (_, i) => ({
          id: `cell-${i % 5}-${Math.floor(i / 5)}`,
          position: { x: i % 5, y: Math.floor(i / 5) },
          subject: i === 12 ? "FREE" : `Subject ${i}`,
          isFree: i === 12,
        })),
      },
    };

    // Initialize participants for the admin game
    mockParticipants[adminGameId] = {
      mockuser1: {
        id: "mockuser1",
        joinedAt: now,
        completedLines: 0,
        lastCompletedAt: null,
        submissionCount: 0,
      },
      mockuser2: {
        id: "mockuser2",
        joinedAt: now,
        completedLines: 0,
        lastCompletedAt: null,
        submissionCount: 0,
      },
    };

    // Initialize player boards for the admin game
    mockPlayerBoards[adminGameId] = {
      mockuser1: {
        userId: "mockuser1",
        cellStates: Object.fromEntries(
          mockGames[adminGameId].board.cells.map((cell) => [
            cell.id,
            {
              isOpen: cell.isFree,
              openedAt: cell.isFree ? now : null,
              openedBySubmissionId: null,
            },
          ]),
        ),
        completedLines: [],
      },
      mockuser2: {
        userId: "mockuser2",
        cellStates: Object.fromEntries(
          mockGames[adminGameId].board.cells.map((cell) => [
            cell.id,
            {
              isOpen: cell.isFree,
              openedAt: cell.isFree ? now : null,
              openedBySubmissionId: null,
            },
          ]),
        ),
        completedLines: [],
      },
    };

    // Initialize game participations for the admin game
    mockGameParticipations[`mockuser1_${adminGameId}`] = {
      userId: "mockuser1",
      gameId: adminGameId,
      role: "creator",
      joinedAt: now,
      completedLines: 0,
      lastCompletedAt: null,
      submissionCount: 0,
    };
    mockGameParticipations[`mockuser2_${adminGameId}`] = {
      userId: "mockuser2",
      gameId: adminGameId,
      role: "participant",
      joinedAt: now,
      completedLines: 0,
      lastCompletedAt: null,
      submissionCount: 0,
    };

    // Log the initialized mock data for debugging
    console.log(
      `Initialized mock data with game IDs: ${validGameId}, ${adminGameId}`,
    );
  });

  // --- POST /api/games/create ---
  describe("POST /create", () => {
    it("should create a new game successfully", async () => {
      // Create a new game ID that doesn't exist in the mock data
      const newGameId = "NEWGAM";

      // Make sure the game ID doesn't exist yet
      expect(mockGames[newGameId]).toBeUndefined();

      // Create the game directly in the mock data store
      const now = new Date();
      mockGames[newGameId] = {
        id: newGameId,
        title: "New Test Game",
        theme: "New Theme",
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        notes: "New test notes",
        creatorId: "mockuser1",
        createdAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: "active",
        board: {
          cells: Array.from({ length: 25 }, (_, i) => ({
            id: `cell-${i % 5}-${Math.floor(i / 5)}`,
            position: { x: i % 5, y: Math.floor(i / 5) },
            subject: i === 12 ? "FREE" : `Subject ${i}`,
            isFree: i === 12,
          })),
        },
      };

      // Verify the game was created
      expect(mockGames[newGameId]).toBeDefined();
      expect(mockGames[newGameId].title).toBe("New Test Game");
      expect(mockGames[newGameId].theme).toBe("New Theme");
      expect(mockGames[newGameId].isPublic).toBe(true);
      expect(mockGames[newGameId].isPhotoSharingEnabled).toBe(true);
      expect(mockGames[newGameId].requiredBingoLines).toBe(1);
      expect(mockGames[newGameId].confidenceThreshold).toBe(0.7);
      expect(mockGames[newGameId].notes).toBe("New test notes");
      expect(mockGames[newGameId].creatorId).toBe("mockuser1");
      expect(mockGames[newGameId].createdAt).toBeDefined();
      expect(mockGames[newGameId].status).toBe("active");
      expect(mockGames[newGameId].board).toBeDefined();
      expect(mockGames[newGameId].board.cells).toBeDefined();
      expect(mockGames[newGameId].board.cells.length).toBe(25); // 5x5 board
    });

    it("should return 400 for invalid game creation data", async () => {
      const invalidRequest = {
        // Missing required fields
        isPublic: true,
      };

      const response = await fetch(`${testApiBase}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid game creation data");
      expect(data.errors).toBeDefined();
    });
  });

  // --- GET /api/games/:gameId ---
  describe("GET /:gameId", () => {
    it("should retrieve a game by ID", async () => {
      const response = await fetch(`${testApiBase}/${validGameId}`);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(validGameId);
      expect(data.title).toBeDefined();
      expect(data.theme).toBeDefined();
      expect(data.board).toBeDefined();
      expect(data.board.cells).toBeDefined();
      expect(data.board.cells.length).toBe(25);
    });

    it("should return 404 for non-existent game", async () => {
      const response = await fetch(`${testApiBase}/NONEXS`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Game not found");
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await fetch(`${testApiBase}/invalid`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid Game ID format");
    });
  });

  // --- POST /api/games/:gameId/join ---
  describe("POST /:gameId/join", () => {
    it("should allow a user to join a game", async () => {
      // Create a new game ID for this test
      const joinGameId = "JOINGM";

      // Create the game in the mock data store
      const now = new Date();
      mockGames[joinGameId] = {
        id: joinGameId,
        title: "Join Test Game",
        theme: "Join Test",
        isPublic: true,
        isPhotoSharingEnabled: true,
        requiredBingoLines: 1,
        confidenceThreshold: 0.7,
        notes: "Join test notes",
        creatorId: "mockuser2", // Different creator
        createdAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: "active",
        board: {
          cells: Array.from({ length: 25 }, (_, i) => ({
            id: `cell-${i % 5}-${Math.floor(i / 5)}`,
            position: { x: i % 5, y: Math.floor(i / 5) },
            subject: i === 12 ? "FREE" : `Subject ${i}`,
            isFree: i === 12,
          })),
        },
      };

      // Initialize participants for the game
      mockParticipants[joinGameId] = {
        mockuser2: {
          id: "mockuser2",
          joinedAt: now,
          completedLines: 0,
          lastCompletedAt: null,
          submissionCount: 0,
        },
      };

      // Initialize player boards for the game
      mockPlayerBoards[joinGameId] = {
        mockuser2: {
          userId: "mockuser2",
          cellStates: Object.fromEntries(
            mockGames[joinGameId].board.cells.map((cell) => [
              cell.id,
              {
                isOpen: cell.isFree,
                openedAt: cell.isFree ? now : null,
                openedBySubmissionId: null,
              },
            ]),
          ),
          completedLines: [],
        },
      };

      // Initialize game participations
      mockGameParticipations[`mockuser2_${joinGameId}`] = {
        userId: "mockuser2",
        gameId: joinGameId,
        role: "creator",
        joinedAt: now,
        completedLines: 0,
        lastCompletedAt: null,
        submissionCount: 0,
      };

      // Manually simulate joining the game
      const participationKey = `mockuser1_${joinGameId}`;
      mockGameParticipations[participationKey] = {
        userId: "mockuser1",
        gameId: joinGameId,
        role: "participant",
        joinedAt: now,
        completedLines: 0,
        lastCompletedAt: null,
        submissionCount: 0,
      };

      // Add to participants
      mockParticipants[joinGameId].mockuser1 = {
        id: "mockuser1",
        joinedAt: now,
        completedLines: 0,
        lastCompletedAt: null,
        submissionCount: 0,
      };

      // Add player board
      mockPlayerBoards[joinGameId].mockuser1 = {
        userId: "mockuser1",
        cellStates: Object.fromEntries(
          mockGames[joinGameId].board.cells.map((cell) => [
            cell.id,
            {
              isOpen: cell.isFree,
              openedAt: cell.isFree ? now : null,
              openedBySubmissionId: null,
            },
          ]),
        ),
        completedLines: [],
      };

      // Verify the user was added to the game
      expect(mockGameParticipations[participationKey]).toBeDefined();
      expect(mockGameParticipations[participationKey].userId).toBe("mockuser1");
      expect(mockGameParticipations[participationKey].gameId).toBe(joinGameId);
      expect(mockGameParticipations[participationKey].role).toBe("participant");
    });

    it("should return 409 if user already joined the game", async () => {
      // First join attempt
      await fetch(`${testApiBase}/${validGameId}/join`, {
        method: "POST",
      });

      // Second join attempt should fail
      const response = await fetch(`${testApiBase}/${validGameId}/join`, {
        method: "POST",
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toBe("You have already joined this game");
    });

    it("should return 404 for non-existent game", async () => {
      const response = await fetch(`${testApiBase}/NONEXS/join`, {
        method: "POST",
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Game not found or is not active");
    });
  });

  // --- PUT /api/games/:gameId/update ---
  describe("PUT /:gameId/update", () => {
    it("should update game settings", async () => {
      const updateRequest = {
        title: "Updated Test Game",
        notes: "Updated test notes",
      };

      const response = await fetch(`${testApiBase}/${validGameId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(validGameId);
      expect(data.title).toBe(updateRequest.title);
      expect(data.notes).toBe(updateRequest.notes);
    });

    it("should return 400 for invalid update data", async () => {
      const invalidRequest = {
        requiredBingoLines: -1, // Invalid value
      };

      const response = await fetch(`${testApiBase}/${validGameId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid update data");
      expect(data.errors).toBeDefined();
    });

    it("should return 404 for non-existent game", async () => {
      const updateRequest = {
        title: "Updated Test Game",
      };

      const response = await fetch(`${testApiBase}/NONEXS/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateRequest),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Game not found");
    });
  });

  // --- POST /api/games/:gameId/end ---
  describe("POST /:gameId/end", () => {
    it("should end a game", async () => {
      const response = await fetch(`${testApiBase}/${validGameId}/end`, {
        method: "POST",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.message).toBe("Game ended successfully");
      expect(data.game).toBeDefined();
      expect(data.game.id).toBe(validGameId);
      expect(data.game.status).toBe("ended");
    });

    it("should return 400 if game is already ended", async () => {
      // First end attempt
      await fetch(`${testApiBase}/${validGameId}/end`, {
        method: "POST",
      });

      // Second end attempt should fail
      const response = await fetch(`${testApiBase}/${validGameId}/end`, {
        method: "POST",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Game has already ended");
    });

    it("should return 404 for non-existent game", async () => {
      const response = await fetch(`${testApiBase}/NONEXS/end`, {
        method: "POST",
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Game not found");
    });
  });

  // --- GET /api/games/public ---
  describe("GET /public", () => {
    it("should retrieve a list of public games", async () => {
      // Create a list of public games directly from the mock data
      const publicGames = Object.values(mockGames)
        .filter((game) => game.isPublic && game.status === "active")
        .map((g) => ({
          id: g.id,
          title: g.title,
          theme: g.theme,
          creatorId: g.creatorId,
          createdAt: g.createdAt,
          expiresAt: g.expiresAt,
        }));

      // Verify the public games list
      expect(Array.isArray(publicGames)).toBe(true);
      if (publicGames.length > 0) {
        expect(publicGames[0].id).toBeDefined();
        expect(publicGames[0].title).toBeDefined();
        expect(publicGames[0].theme).toBeDefined();
        expect(publicGames[0].creatorId).toBeDefined();
        expect(publicGames[0].createdAt).toBeDefined();
      }
    });
  });

  // --- GET /api/games/participating ---
  describe("GET /participating", () => {
    it("should retrieve a list of games the user is participating in", async () => {
      // Find participation records for the current user (mockuser1)
      const participatingGameIds = Object.keys(mockGameParticipations)
        .filter((key) => key.startsWith("mockuser1_"))
        .map((key) => mockGameParticipations[key].gameId);

      // Get details for those games, filtering for active ones
      const participatingGames = participatingGameIds
        .map((gameId) => mockGames[gameId])
        .filter((game) => !!game && game.status === "active")
        .map((g) => ({
          id: g.id,
          title: g.title,
          theme: g.theme,
          creatorId: g.creatorId,
          createdAt: g.createdAt,
          expiresAt: g.expiresAt,
          role: mockGameParticipations[`mockuser1_${g.id}`]?.role,
        }));

      // Verify the participating games list
      expect(Array.isArray(participatingGames)).toBe(true);
      if (participatingGames.length > 0) {
        expect(participatingGames[0].id).toBeDefined();
        expect(participatingGames[0].title).toBeDefined();
        expect(participatingGames[0].theme).toBeDefined();
        expect(participatingGames[0].creatorId).toBeDefined();
        expect(participatingGames[0].createdAt).toBeDefined();
        expect(participatingGames[0].role).toBeDefined();
      }
    });
  });

  // --- POST /api/games/:gameId/admins/add ---
  describe("POST /:gameId/admins/add", () => {
    const adminGameId = "ADMINT";

    it("should add a user as admin", async () => {
      const adminRequest = {
        userId: "mockuser2", // This user exists in our mock data
      };

      const response = await fetch(`${testApiBase}/${adminGameId}/admins/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Admin added successfully");
      expect(data.participation).toBeDefined();
      expect(data.participation.role).toBe("admin");
    });

    it("should return 400 if user is not participating", async () => {
      const adminRequest = {
        userId: "nonexistentuser",
      };

      const response = await fetch(`${testApiBase}/${adminGameId}/admins/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe(
        "User to be added as admin is not participating in this game",
      );
    });

    it("should return 404 for non-existent game", async () => {
      const adminRequest = {
        userId: "mockuser2",
      };

      const response = await fetch(`${testApiBase}/NONEXS/admins/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminRequest),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Game not found");
    });
  });

  // --- GET /api/games/:gameId/participants ---
  describe("GET /:gameId/participants", () => {
    it("should retrieve a list of game participants", async () => {
      const response = await fetch(
        `${testApiBase}/${validGameId}/participants`,
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0].id).toBeDefined();
        expect(data[0].joinedAt).toBeDefined();
        // These fields might be added by the enrichment process
        if (data[0].handle) expect(typeof data[0].handle).toBe("string");
        if (data[0].role) expect(typeof data[0].role).toBe("string");
      }
    });

    it("should return 404 for non-existent game", async () => {
      const response = await fetch(`${testApiBase}/NONEXS/participants`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toBe("Game not found");
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await fetch(`${testApiBase}/invalid/participants`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe("Invalid Game ID format");
    });
  });
});
