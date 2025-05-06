import { adminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock Firebase Admin SDK
vi.mock("@/lib/firebase/admin", () => {
  return {
    adminFirestore: {
      collection: vi.fn(),
    },
  };
});

describe("/api/auth/check-handle endpoint", () => {
  // Setup mocks
  const mockCollection = vi.fn();
  const mockWhere = vi.fn();
  const mockGet = vi.fn();
  const mockSnapshot = {
    empty: true,
    size: 0,
  };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup Firestore mock chain
    mockCollection.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockReturnValue({
      get: mockGet,
    });
    mockGet.mockResolvedValue(mockSnapshot);

    // Setup adminFirestore mock
    adminFirestore.collection = mockCollection;

    // Mock console.log and console.error
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 if handle is not provided", async () => {
    // Create request with empty body
    const request = new NextRequest(
      "http://localhost:3000/api/auth/check-handle",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Handle is required",
    });

    // Verify Firestore was not called
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it("should return available: true when handle does not exist", async () => {
    // Setup mock to return empty snapshot
    mockSnapshot.empty = true;

    // Create request with handle
    const request = new NextRequest(
      "http://localhost:3000/api/auth/check-handle",
      {
        method: "POST",
        body: JSON.stringify({ handle: "John Doe" }),
      },
    );

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      available: true,
    });

    // Verify Firestore was called correctly
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("handle", "==", "John Doe");
    expect(mockGet).toHaveBeenCalled();
  });

  it("should return available: false when handle already exists", async () => {
    // Setup mock to return non-empty snapshot
    mockSnapshot.empty = false;
    mockSnapshot.size = 1;

    // Create request with handle
    const request = new NextRequest(
      "http://localhost:3000/api/auth/check-handle",
      {
        method: "POST",
        body: JSON.stringify({ handle: "existinguser" }),
      },
    );

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      available: false,
    });

    // Verify Firestore was called correctly
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("handle", "==", "existinguser");
    expect(mockGet).toHaveBeenCalled();
  });

  it("should handle Firestore NOT_FOUND error and return available: true", async () => {
    // Setup mock to throw NOT_FOUND error
    const notFoundError = new Error("NOT_FOUND");
    Object.defineProperty(notFoundError, "code", { value: 5 });
    mockGet.mockRejectedValue(notFoundError);

    // Create request with handle
    const request = new NextRequest(
      "http://localhost:3000/api/auth/check-handle",
      {
        method: "POST",
        body: JSON.stringify({ handle: "newuser" }),
      },
    );

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      available: true,
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      "Error executing Firestore query:",
      expect.any(Error),
    );
  });

  it("should return 500 when an unexpected error occurs", async () => {
    // Setup mock to throw unexpected error
    mockGet.mockRejectedValue(new Error("Unexpected error"));

    // Create request with handle
    const request = new NextRequest(
      "http://localhost:3000/api/auth/check-handle",
      {
        method: "POST",
        body: JSON.stringify({ handle: "John Doe" }),
      },
    );

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Failed to check handle availability",
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      "Error checking handle availability:",
      expect.any(Error),
    );
  });
});
