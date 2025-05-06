import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock Firebase Admin SDK
vi.mock("@/lib/firebase/admin", () => {
  return {
    adminAuth: {
      createCustomToken: vi.fn(),
    },
    adminFirestore: {
      collection: vi.fn(),
    },
  };
});

describe("/api/auth/login endpoint", () => {
  // Setup mocks
  const mockCreateCustomToken = vi.fn();
  const mockCollection = vi.fn();
  const mockWhere = vi.fn();
  const mockGet = vi.fn();
  const mockUpdate = vi.fn();
  const mockSnapshot = {
    empty: false,
    size: 1,
    docs: [
      {
        id: "test-user-id",
        ref: {
          update: mockUpdate,
        },
      },
    ],
  };

  // Test data
  const testUid = "test-user-id";
  const testHandle = "John Doe";
  const testPassword = "password123";
  const testCustomToken = "test-custom-token";

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup Auth mock
    mockCreateCustomToken.mockResolvedValue(testCustomToken);
    adminAuth.createCustomToken = mockCreateCustomToken;

    // Setup Firestore mock chain
    mockCollection.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockReturnValue({
      get: mockGet,
    });
    mockGet.mockResolvedValue(mockSnapshot);
    mockUpdate.mockResolvedValue(undefined);

    // Setup adminFirestore mock
    adminFirestore.collection = mockCollection;

    // Mock Date.toISOString
    const mockDate = new Date("2025-05-06T12:00:00Z");
    vi.spyOn(global, "Date").mockImplementation(() => mockDate as Date);

    // Mock console.log and console.error
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 if handle or password is missing", async () => {
    // Create request with missing handle and password
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({}),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Handle and password are required",
    });

    // Verify Firestore was not called
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it("should return 401 if handle does not exist", async () => {
    // Setup mock to return empty snapshot
    const emptySnapshot = {
      empty: true,
      size: 0,
      docs: [],
    };
    mockGet.mockResolvedValue(emptySnapshot);

    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Invalid handle or password",
    });

    // Verify Firestore was called correctly
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("handle", "==", testHandle);
    expect(mockGet).toHaveBeenCalled();
    expect(mockCreateCustomToken).not.toHaveBeenCalled();
  });

  it("should successfully login a user when credentials are valid", async () => {
    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      customToken: testCustomToken,
    });

    // Verify Firestore was called correctly
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("handle", "==", testHandle);
    expect(mockGet).toHaveBeenCalled();
    expect(mockCreateCustomToken).toHaveBeenCalledWith(testUid);
    expect(mockUpdate).toHaveBeenCalledWith({
      lastLoginAt: "2025-05-06T12:00:00.000Z",
    });
  });

  it("should handle Firestore NOT_FOUND error", async () => {
    // Setup mock to throw NOT_FOUND error
    const notFoundError = new Error("NOT_FOUND");
    Object.defineProperty(notFoundError, "code", { value: 5 });
    mockGet.mockRejectedValue(notFoundError);

    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Failed to log in",
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      "Error logging in:",
      expect.any(Error),
    );
  });

  it("should return 500 when an unexpected error occurs", async () => {
    // Setup mock to throw unexpected error
    mockCreateCustomToken.mockRejectedValue(new Error("Unexpected error"));

    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Failed to log in",
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      "Error logging in:",
      expect.any(Error),
    );
  });
});
