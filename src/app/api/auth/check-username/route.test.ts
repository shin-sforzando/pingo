import { adminFirestore } from "@/lib/firebase/admin";
import type { NextRequest } from "next/server";
import {
  type MockedFunction,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { POST } from "./route";

// Mock Firebase Admin SDK
vi.mock("@/lib/firebase/admin", () => ({
  adminFirestore: {
    collection: vi.fn(),
  },
}));

describe("POST /api/auth/check-username", () => {
  let mockRequest: NextRequest;
  let mockCollectionRef: {
    where: MockedFunction<(...args: unknown[]) => unknown>;
  };
  let mockQueryRef: { get: MockedFunction<() => unknown> };
  let mockQuerySnapshot: { empty: boolean };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Mock Firestore query
    mockQuerySnapshot = {
      empty: true,
    };
    mockQueryRef = {
      get: vi.fn().mockResolvedValue(mockQuerySnapshot),
    };
    mockCollectionRef = {
      where: vi.fn().mockReturnValue(mockQueryRef),
    };

    // Setup Firestore collection mock
    (
      adminFirestore.collection as MockedFunction<
        (...args: unknown[]) => unknown
      >
    ).mockReturnValue(mockCollectionRef);

    // Create mock request
    mockRequest = {
      json: vi.fn().mockResolvedValue({
        username: "John Doe",
      }),
    } as unknown as NextRequest;
  });

  it("should return 400 if username is missing", async () => {
    // Override the mock to return empty username
    mockRequest.json = vi.fn().mockResolvedValue({});

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username is required");
  });

  it("should return 400 if username contains invalid characters", async () => {
    // Override the mock to return username with invalid characters
    mockRequest.json = vi.fn().mockResolvedValue({
      username: "John.Doe",
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username contains invalid characters");
    expect(data.available).toBe(false);
  });

  it("should return 400 if username contains $ character", async () => {
    // Override the mock to return username with $ character
    mockRequest.json = vi.fn().mockResolvedValue({
      username: "John$Doe",
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username contains invalid characters");
    expect(data.available).toBe(false);
  });

  it("should return 400 if username contains / character", async () => {
    // Override the mock to return username with / character
    mockRequest.json = vi.fn().mockResolvedValue({
      username: "John/Doe",
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username contains invalid characters");
    expect(data.available).toBe(false);
  });

  it("should return available: false if username already exists", async () => {
    // Override the mock to simulate username already exists
    mockQuerySnapshot.empty = false;

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(false);
  });

  it("should return available: true if username is available", async () => {
    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(true);

    // Verify Firestore operations
    expect(adminFirestore.collection).toHaveBeenCalledWith("users");
    expect(mockCollectionRef.where).toHaveBeenCalledWith(
      "username",
      "==",
      "John Doe",
    );
  });

  it("should handle NOT_FOUND error and return available: true", async () => {
    // Override the mock to simulate NOT_FOUND error
    mockQueryRef.get = vi.fn().mockRejectedValue({
      code: 5,
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.available).toBe(true);
  });

  it("should handle other errors and return 500", async () => {
    // Override the mock to simulate other error
    mockQueryRef.get = vi.fn().mockRejectedValue(new Error("Test error"));

    const response = await POST(mockRequest);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe("Failed to check username availability");
  });
});
