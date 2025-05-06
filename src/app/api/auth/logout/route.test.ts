import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("/api/auth/logout endpoint", () => {
  beforeEach(() => {
    // Mock console.log and console.error
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully logout a user", async () => {
    // Execute
    const response = await POST();

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      success: true,
    });
  });

  it("should handle errors gracefully", async () => {
    // Store original implementation
    const originalJson = NextResponse.json;

    // Create a spy on NextResponse.json that will throw an error on first call
    // but work normally on subsequent calls
    const jsonSpy = vi.spyOn(NextResponse, "json");
    let callCount = 0;
    jsonSpy.mockImplementation((...args) => {
      if (callCount === 0) {
        callCount++;
        throw new Error("Unexpected error");
      }
      return originalJson(...args);
    });

    try {
      // Execute
      const response = await POST();

      // Verify
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData).toEqual({
        error: "Failed to log out",
      });

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        "Error logging out:",
        expect.any(Error),
      );
    } finally {
      // Restore original NextResponse.json
      jsonSpy.mockRestore();
    }
  });
});
