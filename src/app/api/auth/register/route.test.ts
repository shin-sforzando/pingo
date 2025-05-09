import { adminAuth, adminFirestore } from "@/lib/firebase/admin";
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
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
  adminFirestore: {
    collection: vi.fn(),
  },
}));

// Mock bcrypt
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

describe("POST /api/auth/register", () => {
  let mockRequest: NextRequest;
  let mockCollectionRef: {
    where: MockedFunction<(...args: unknown[]) => unknown>;
    doc: MockedFunction<(...args: unknown[]) => unknown>;
  };
  let mockDocRef: { set: MockedFunction<() => unknown> };
  let mockQueryRef: { get: MockedFunction<() => unknown> };
  let mockQuerySnapshot: { empty: boolean; docs: Array<unknown> };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Mock Firestore query
    mockQuerySnapshot = {
      empty: true,
      docs: [],
    };
    mockQueryRef = {
      get: vi.fn().mockResolvedValue(mockQuerySnapshot),
    };
    mockDocRef = {
      set: vi.fn().mockResolvedValue({}),
    };
    mockCollectionRef = {
      where: vi.fn().mockReturnValue(mockQueryRef),
      doc: vi.fn().mockReturnValue(mockDocRef),
    };

    // Setup Firestore collection mock
    (
      adminFirestore.collection as MockedFunction<
        (...args: unknown[]) => unknown
      >
    ).mockReturnValue(mockCollectionRef);

    // Setup Auth mock
    (
      adminAuth.verifyIdToken as MockedFunction<(...args: unknown[]) => unknown>
    ).mockResolvedValue({
      uid: "test-uid",
    });

    // Create mock request
    mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue("Bearer test-token"),
      },
      json: vi.fn().mockResolvedValue({
        username: "John Doe",
        password: "password123",
      }),
    } as unknown as NextRequest;
  });

  it("should return 400 if username or password is missing", async () => {
    // Override the mock to return empty username and password
    mockRequest.json = vi.fn().mockResolvedValue({});

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username and password are required");
  });

  it("should return 400 if username contains invalid characters", async () => {
    // Override the mock to return username with invalid characters
    mockRequest.json = vi.fn().mockResolvedValue({
      username: "John.Doe",
      password: "password123",
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username contains invalid characters");
  });

  it("should return 400 if username contains $ character", async () => {
    // Override the mock to return username with $ character
    mockRequest.json = vi.fn().mockResolvedValue({
      username: "John$Doe",
      password: "password123",
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username contains invalid characters");
  });

  it("should return 400 if username contains / character", async () => {
    // Override the mock to return username with / character
    mockRequest.json = vi.fn().mockResolvedValue({
      username: "John/Doe",
      password: "password123",
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username contains invalid characters");
  });

  it("should return 400 if username is already taken", async () => {
    // Override the mock to simulate username already exists
    mockQuerySnapshot.empty = false;
    mockQuerySnapshot.docs = [{ id: "existing-user" }];

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Username is already taken");
  });

  it("should create user document and return success", async () => {
    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify Firestore operations
    expect(adminFirestore.collection).toHaveBeenCalledWith("users");
    expect(mockCollectionRef.where).toHaveBeenCalledWith(
      "username",
      "==",
      "John Doe",
    );
    expect(mockCollectionRef.doc).toHaveBeenCalledWith("test-uid");
    expect(mockDocRef.set).toHaveBeenCalled();
  });
});
