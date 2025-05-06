import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock Firebase Admin SDK
vi.mock("@/lib/firebase/admin", () => {
  return {
    adminAuth: {
      verifyIdToken: vi.fn(),
    },
    adminFirestore: {
      collection: vi.fn(),
    },
  };
});

describe("/api/auth/register endpoint", () => {
  // Setup mocks
  const mockVerifyIdToken = vi.fn();
  const mockCollection = vi.fn();
  const mockWhere = vi.fn();
  const mockGet = vi.fn();
  const mockDoc = vi.fn();
  const mockSet = vi.fn();
  const mockSnapshot = {
    empty: true,
    size: 0,
  };

  // Test data
  const testUid = "test-user-id";
  const testHandle = "John Doe";
  const testPassword = "password123";
  const testIdToken = "test-id-token";

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup Auth mock
    mockVerifyIdToken.mockResolvedValue({ uid: testUid });
    adminAuth.verifyIdToken = mockVerifyIdToken;

    // Setup Firestore mock chain
    mockCollection.mockReturnValue({
      where: mockWhere,
      doc: mockDoc,
    });
    mockWhere.mockReturnValue({
      get: mockGet,
    });
    mockDoc.mockReturnValue({
      set: mockSet,
    });
    mockGet.mockResolvedValue(mockSnapshot);
    mockSet.mockResolvedValue(undefined);

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

  it("should return 401 if Authorization header is missing", async () => {
    // Create request without Authorization header
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
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
      error: "Unauthorized: Missing or invalid token",
    });

    // Verify Auth was not called
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header is invalid", async () => {
    // Create request with invalid Authorization header
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        Authorization: "Invalid",
      },
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Unauthorized: Missing or invalid token",
    });

    // Verify Auth was not called
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("should return 400 if handle or password is missing", async () => {
    // Create request with missing handle and password
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testIdToken}`,
      },
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

    // Verify Auth was called but Firestore was not
    expect(mockVerifyIdToken).toHaveBeenCalledWith(testIdToken);
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it("should return 400 if handle already exists", async () => {
    // Setup mock to return non-empty snapshot
    mockSnapshot.empty = false;
    mockSnapshot.size = 1;

    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testIdToken}`,
      },
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Handle is already taken",
    });

    // Verify Firestore was called correctly
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("handle", "==", testHandle);
    expect(mockGet).toHaveBeenCalled();
    expect(mockDoc).not.toHaveBeenCalled(); // Document should not be created
  });

  it("should successfully register a user when handle is available", async () => {
    // Setup mock to return empty snapshot
    mockSnapshot.empty = true;

    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testIdToken}`,
      },
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      success: true,
    });

    // Verify Firestore was called correctly
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("handle", "==", testHandle);
    expect(mockGet).toHaveBeenCalled();
    expect(mockDoc).toHaveBeenCalledWith(testUid);
    expect(mockSet).toHaveBeenCalledWith({
      id: testUid,
      handle: testHandle,
      createdAt: "2025-05-06T12:00:00.000Z",
      lastLoginAt: "2025-05-06T12:00:00.000Z",
      participatingGames: [],
      gameHistory: [],
    });
  });

  it("should handle Firestore NOT_FOUND error during handle check", async () => {
    // Setup mock to throw NOT_FOUND error
    const notFoundError = new Error("NOT_FOUND");
    Object.defineProperty(notFoundError, "code", { value: 5 });
    mockGet.mockRejectedValue(notFoundError);

    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testIdToken}`,
      },
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      success: true,
    });

    // Verify Firestore was called correctly
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockWhere).toHaveBeenCalledWith("handle", "==", testHandle);
    expect(mockGet).toHaveBeenCalled();
    expect(mockDoc).toHaveBeenCalledWith(testUid);
    expect(mockSet).toHaveBeenCalled();
  });

  it("should return 500 when an unexpected error occurs during document creation", async () => {
    // Setup mock to throw unexpected error during document creation
    mockSet.mockRejectedValue(new Error("Unexpected error"));

    // Create request with valid data
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testIdToken}`,
      },
      body: JSON.stringify({ handle: testHandle, password: testPassword }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);

    const responseData = await response.json();
    expect(responseData).toEqual({
      error: "Failed to register user",
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      "Error registering user:",
      expect.any(Error),
    );
  });
});
