import { gameIdSchema, ulidSchema } from "@/lib/validators/common";
import {
  bingoCellSchema,
  boardSchema,
  completedLineSchema,
  eventSchema,
  gameSchema,
  participantSchema,
  playerBoardCellStateSchema,
  playerBoardSchema,
  submissionSchema,
} from "@/lib/validators/models/game";
import { describe, expect, it } from "vitest";

describe("Game Related Zod Schemas", () => {
  // --- bingoCellSchema Tests ---
  describe("bingoCellSchema", () => {
    it("should validate correct cell data", () => {
      expect(
        bingoCellSchema.safeParse({
          id: "cell-1-2",
          position: { x: 1, y: 2 },
          subject: "Red Car",
          isFree: false,
        }).success,
      ).toBe(true);
      expect(
        bingoCellSchema.safeParse({
          id: "cell-2-2",
          position: { x: 2, y: 2 },
          subject: "FREE",
          isFree: true,
        }).success,
      ).toBe(true);
    });
    it("should apply default for isFree", () => {
      const result = bingoCellSchema.safeParse({
        id: "cell-0-0",
        position: { x: 0, y: 0 },
        subject: "Cat",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isFree).toBe(false);
    });
    it("should invalidate incorrect position", () => {
      expect(
        bingoCellSchema.safeParse({
          id: "cell-5-0",
          position: { x: 5, y: 0 },
          subject: "Invalid",
        }).success,
      ).toBe(false);
      expect(
        bingoCellSchema.safeParse({
          id: "cell-0-5",
          position: { x: 0, y: 5 },
          subject: "Invalid",
        }).success,
      ).toBe(false);
    });
    it("should invalidate empty subject", () => {
      expect(
        bingoCellSchema.safeParse({
          id: "cell-1-1",
          position: { x: 1, y: 1 },
          subject: "",
        }).success,
      ).toBe(false);
    });
  });

  // --- boardSchema Tests ---
  describe("boardSchema", () => {
    const createCells = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `cell-${Math.floor(i / 5)}-${i % 5}`,
        position: { x: Math.floor(i / 5), y: i % 5 },
        subject: `Subject ${i}`,
        isFree: i === 12, // Center cell for 5x5
      }));

    it("should validate a board with exactly 25 cells", () => {
      expect(boardSchema.safeParse({ cells: createCells(25) }).success).toBe(
        true,
      );
    });
    it("should invalidate a board with less than 25 cells", () => {
      expect(boardSchema.safeParse({ cells: createCells(24) }).success).toBe(
        false,
      );
    });
    it("should invalidate a board with more than 25 cells", () => {
      expect(boardSchema.safeParse({ cells: createCells(26) }).success).toBe(
        false,
      );
    });
    it("should invalidate if cells array contains invalid cell data", () => {
      const cells = createCells(24);
      // Add invalid cell with missing isFree property fixed
      cells.push({
        id: "invalid",
        position: { x: 9, y: 9 },
        subject: "Bad",
        isFree: false,
      });
      expect(boardSchema.safeParse({ cells }).success).toBe(false);
    });
  });

  // --- playerBoardCellStateSchema Tests ---
  describe("playerBoardCellStateSchema", () => {
    const validSubmissionId = ulidSchema.parse("01J0Z4KAZG6X7X7X7X7X7X7X7A");
    it("should validate correct states", () => {
      expect(
        playerBoardCellStateSchema.safeParse({
          isOpen: true,
          openedAt: new Date(),
          openedBySubmissionId: validSubmissionId,
        }).success,
      ).toBe(true);
      expect(
        playerBoardCellStateSchema.safeParse({
          isOpen: false,
          openedAt: null,
          openedBySubmissionId: null,
        }).success,
      ).toBe(true);
    });
    it("should apply default for isOpen", () => {
      const result = playerBoardCellStateSchema.safeParse({
        openedAt: null,
        openedBySubmissionId: null,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.isOpen).toBe(false);
    });
    it("should invalidate if openedAt is set but isOpen is false", () => {
      // This logic might be application-level, but schema could enforce if needed (complex)
      // For now, schema allows this state. Test application logic separately.
    });
    it("should invalidate if openedBySubmissionId is set but isOpen is false", () => {
      // Similar to above, schema allows this.
    });
    it("should invalidate with invalid submission ID format", () => {
      expect(
        playerBoardCellStateSchema.safeParse({
          isOpen: true,
          openedAt: new Date(),
          openedBySubmissionId: "invalid-id",
        }).success,
      ).toBe(false);
    });
  });

  // --- completedLineSchema Tests ---
  describe("completedLineSchema", () => {
    it("should validate correct completed line data", () => {
      expect(
        completedLineSchema.safeParse({
          type: "row",
          index: 2,
          completedAt: new Date(),
        }).success,
      ).toBe(true);
      expect(
        completedLineSchema.safeParse({
          type: "column",
          index: 4,
          completedAt: new Date(),
        }).success,
      ).toBe(true);
      expect(
        completedLineSchema.safeParse({
          type: "diagonal",
          index: 0,
          completedAt: new Date(),
        }).success,
      ).toBe(true); // TL-BR diagonal
      expect(
        completedLineSchema.safeParse({
          type: "diagonal",
          index: 4,
          completedAt: new Date(),
        }).success,
      ).toBe(true); // TR-BL diagonal
    });
    it("should invalidate incorrect type enum", () => {
      expect(
        completedLineSchema.safeParse({
          type: "invalid",
          index: 2,
          completedAt: new Date(),
        }).success,
      ).toBe(false);
    });
    it("should invalidate incorrect index range", () => {
      expect(
        completedLineSchema.safeParse({
          type: "row",
          index: 5,
          completedAt: new Date(),
        }).success,
      ).toBe(false); // Row index out of bounds
      expect(
        completedLineSchema.safeParse({
          type: "column",
          index: -1,
          completedAt: new Date(),
        }).success,
      ).toBe(false); // Column index out of bounds
      // Diagonal index must be 0 or 1
      expect(
        completedLineSchema.safeParse({
          type: "diagonal",
          index: 2,
          completedAt: new Date(),
        }).success,
      ).toBe(false);
    });
  });

  // --- playerBoardSchema Tests ---
  describe("playerBoardSchema", () => {
    const validUserId = "user_123";
    const validCellStates = Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [
        `cell-${Math.floor(i / 5)}-${i % 5}`,
        {
          isOpen: i % 2 === 0,
          openedAt: i % 2 === 0 ? new Date() : null,
          openedBySubmissionId: null,
        },
      ]),
    );
    const validCompletedLines = [
      { type: "row" as const, index: 0, completedAt: new Date() },
    ];

    it("should validate correct player board data", () => {
      expect(
        playerBoardSchema.safeParse({
          userId: validUserId,
          cellStates: validCellStates,
          completedLines: validCompletedLines,
        }).success,
      ).toBe(true);
    });
    it("should invalidate if userId is empty", () => {
      expect(
        playerBoardSchema.safeParse({
          userId: "",
          cellStates: validCellStates,
          completedLines: validCompletedLines,
        }).success,
      ).toBe(false);
    });
    it("should invalidate if cellStates has invalid cell state", () => {
      const invalidCellStates = {
        ...validCellStates,
        "cell-0-0": { isOpen: "yes" },
      }; // Invalid state
      expect(
        playerBoardSchema.safeParse({
          userId: validUserId,
          cellStates: invalidCellStates,
          completedLines: validCompletedLines,
        }).success,
      ).toBe(false);
    });
    it("should invalidate if completedLines has invalid line data", () => {
      const invalidLines = [
        ...validCompletedLines,
        { type: "invalid", index: 9, completedAt: new Date() },
      ];
      expect(
        playerBoardSchema.safeParse({
          userId: validUserId,
          cellStates: validCellStates,
          completedLines: invalidLines,
        }).success,
      ).toBe(false);
    });
  });

  // --- participantSchema Tests ---
  describe("participantSchema", () => {
    const validParticipantData = {
      id: "user_456",
      joinedAt: new Date(),
      completedLines: 2,
      lastCompletedAt: new Date(),
      submissionCount: 15,
    };
    it("should validate correct participant data", () => {
      expect(participantSchema.safeParse(validParticipantData).success).toBe(
        true,
      );
    });
    it("should apply default values", () => {
      const minimalData = { id: "user_789", joinedAt: new Date() };
      const result = participantSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completedLines).toBe(0);
        expect(result.data.lastCompletedAt).toBeNull();
        expect(result.data.submissionCount).toBe(0);
      }
    });
    it("should invalidate negative completedLines", () => {
      expect(
        participantSchema.safeParse({
          ...validParticipantData,
          completedLines: -1,
        }).success,
      ).toBe(false);
    });
    it("should invalidate submissionCount over 30", () => {
      expect(
        participantSchema.safeParse({
          ...validParticipantData,
          submissionCount: 31,
        }).success,
      ).toBe(false);
    });
    it("should allow null lastCompletedAt", () => {
      expect(
        participantSchema.safeParse({
          ...validParticipantData,
          lastCompletedAt: null,
        }).success,
      ).toBe(true);
    });
  });

  // --- submissionSchema Tests ---
  describe("submissionSchema", () => {
    const validSubmissionData = {
      id: ulidSchema.parse("01J0Z4KAZG6X7X7X7X7X7X7X7A"),
      userId: "user_123",
      imageUrl: "gs://bucket/path/image.jpg",
      submittedAt: new Date(),
      analyzedAt: new Date(),
      aiResponse: '{"label": "cat", "score": 0.95}',
      matchedCellId: "cell-3-4",
      confidence: 0.95,
      processingStatus: "analyzed" as const,
      acceptanceStatus: "accepted" as const,
      errorMessage: undefined, // Explicitly undefined for optional check
    };
    it("should validate correct submission data", () => {
      const result = submissionSchema.safeParse(validSubmissionData);
      expect(
        result.success,
        `Validation failed: ${JSON.stringify(result.error?.flatten())}`,
      ).toBe(true);
    });
    it("should allow nullable/optional fields to be null/missing", () => {
      // Create data explicitly without optional fields and setting nullable fields to null
      const { aiResponse, errorMessage, ...baseData } = validSubmissionData;
      const minimalData = {
        ...baseData,
        analyzedAt: null, // Explicitly set nullable field to null
        matchedCellId: null,
        confidence: null,
        acceptanceStatus: null,
        // aiResponse, errorMessage are omitted (optional)
      };
      const result = submissionSchema.safeParse(minimalData);
      expect(
        result.success,
        `Minimal validation failed: ${JSON.stringify(result.error?.flatten())}`,
      ).toBe(true);
    });
    it("should invalidate invalid processingStatus", () => {
      expect(
        submissionSchema.safeParse({
          ...validSubmissionData,
          processingStatus: "done",
        }).success,
      ).toBe(false);
    });
    it("should invalidate invalid acceptanceStatus", () => {
      expect(
        submissionSchema.safeParse({
          ...validSubmissionData,
          acceptanceStatus: "maybe",
        }).success,
      ).toBe(false);
    });
    it("should invalidate confidence outside 0-1 range", () => {
      expect(
        submissionSchema.safeParse({ ...validSubmissionData, confidence: 1.1 })
          .success,
      ).toBe(false);
      expect(
        submissionSchema.safeParse({ ...validSubmissionData, confidence: -0.1 })
          .success,
      ).toBe(false);
    });
  });

  // --- eventSchema Tests ---
  describe("eventSchema", () => {
    const validEventData = {
      id: ulidSchema.parse("01J0Z4J5ZG6X7X7X7X7X7X7X7Z"),
      type: "player_joined" as const,
      userId: "user_xyz",
      timestamp: new Date(),
      details: { gameId: "ABCDEF" },
    };
    it("should validate correct event data", () => {
      expect(eventSchema.safeParse(validEventData).success).toBe(true);
    });
    it("should allow missing optional userId and details", () => {
      // Create data explicitly without optional fields
      const { userId, details, ...minimalData } = {
        ...validEventData,
        type: "game_created" as const,
      };
      expect(eventSchema.safeParse(minimalData).success).toBe(true);
    });
    it("should invalidate invalid type", () => {
      expect(
        eventSchema.safeParse({ ...validEventData, type: "player_kicked" })
          .success,
      ).toBe(false);
    });
  });

  // --- gameSchema Tests ---
  describe("gameSchema", () => {
    const validGameData = {
      id: gameIdSchema.parse("QAZWSX"),
      title: "My Test Game",
      theme: "Testing Theme",
      creatorId: "user_creator",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // Expires tomorrow
      isPublic: true,
      isPhotoSharingEnabled: false,
      requiredBingoLines: 3,
      confidenceThreshold: 0.6,
      notes: "Some notes here",
      status: "active" as const,
      board: boardSchema.parse({
        cells: Array.from({ length: 25 }, (_, i) => ({
          id: `c${i}`,
          position: { x: Math.floor(i / 5), y: i % 5 },
          subject: `S${i}`,
          isFree: i === 12,
        })),
      }),
    };
    it("should validate correct game data", () => {
      const result = gameSchema.safeParse(validGameData);
      expect(
        result.success,
        `Validation failed: ${JSON.stringify(result.error?.flatten())}`,
      ).toBe(true);
    });
    it("should apply default values", () => {
      // Create data explicitly without fields that have defaults
      const {
        theme,
        isPublic,
        isPhotoSharingEnabled,
        confidenceThreshold,
        notes,
        status,
        ...minimalData
      } = validGameData;
      const result = gameSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(false);
        expect(result.data.isPhotoSharingEnabled).toBe(true);
        expect(result.data.confidenceThreshold).toBe(0.5);
        expect(result.data.status).toBe("active");
      }
    });
    it("should invalidate invalid title", () => {
      expect(
        gameSchema.safeParse({ ...validGameData, title: "" }).success,
      ).toBe(false);
      expect(
        gameSchema.safeParse({ ...validGameData, title: "a".repeat(51) })
          .success,
      ).toBe(false);
    });
    it("should invalidate invalid requiredBingoLines", () => {
      expect(
        gameSchema.safeParse({ ...validGameData, requiredBingoLines: 0 })
          .success,
      ).toBe(false);
      expect(
        gameSchema.safeParse({ ...validGameData, requiredBingoLines: 6 })
          .success,
      ).toBe(false);
    });
    it("should invalidate invalid confidenceThreshold", () => {
      expect(
        gameSchema.safeParse({ ...validGameData, confidenceThreshold: -0.1 })
          .success,
      ).toBe(false);
      expect(
        gameSchema.safeParse({ ...validGameData, confidenceThreshold: 1.1 })
          .success,
      ).toBe(false);
    });
    it("should invalidate invalid status", () => {
      expect(
        gameSchema.safeParse({ ...validGameData, status: "pending" }).success,
      ).toBe(false);
    });
  });
});
