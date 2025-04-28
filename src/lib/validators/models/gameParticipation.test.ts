import { describe, expect, it } from "vitest";
import { gameIdSchema } from "../common";
import { gameParticipationSchema } from "./gameParticipation";

describe("GameParticipation Zod Schema", () => {
  const validGameParticipationData = {
    userId: "user_123",
    gameId: gameIdSchema.parse("ABCDEF"),
    role: "participant" as const,
    joinedAt: new Date(),
    completedLines: 1,
    lastCompletedAt: new Date(),
    submissionCount: 5,
  };

  it("should validate correct game participation data", () => {
    const result = gameParticipationSchema.safeParse(
      validGameParticipationData,
    );
    expect(
      result.success,
      `Validation failed: ${JSON.stringify(result.error?.flatten())}`,
    ).toBe(true);
  });

  it("should apply default values for counts and nullable timestamp", () => {
    const minimalData = {
      userId: "user_456",
      gameId: gameIdSchema.parse("GHIJKL"),
      role: "creator" as const,
      joinedAt: new Date(),
    };
    const result = gameParticipationSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completedLines).toBe(0);
      expect(result.data.lastCompletedAt).toBeNull();
      expect(result.data.submissionCount).toBe(0);
    }
  });

  it("should invalidate data with empty userId", () => {
    const invalidData = { ...validGameParticipationData, userId: "" };
    expect(gameParticipationSchema.safeParse(invalidData).success).toBe(false);
  });

  it("should invalidate data with invalid gameId", () => {
    const invalidData = { ...validGameParticipationData, gameId: "invalid" };
    expect(gameParticipationSchema.safeParse(invalidData).success).toBe(false);
  });

  it("should invalidate data with invalid role", () => {
    const invalidData = { ...validGameParticipationData, role: "viewer" };
    expect(gameParticipationSchema.safeParse(invalidData).success).toBe(false);
  });

  it("should invalidate negative completedLines", () => {
    const invalidData = { ...validGameParticipationData, completedLines: -1 };
    expect(gameParticipationSchema.safeParse(invalidData).success).toBe(false);
  });

  it("should invalidate submissionCount over 30", () => {
    const invalidData = { ...validGameParticipationData, submissionCount: 31 };
    expect(gameParticipationSchema.safeParse(invalidData).success).toBe(false);
  });

  it("should allow null lastCompletedAt", () => {
    const dataWithNullTimestamp = {
      ...validGameParticipationData,
      lastCompletedAt: null,
    };
    expect(
      gameParticipationSchema.safeParse(dataWithNullTimestamp).success,
    ).toBe(true);
  });
});
