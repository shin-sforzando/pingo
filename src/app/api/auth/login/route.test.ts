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
  adminAuth: {
    createCustomToken: vi.fn().mockResolvedValue("custom-token"),
    verifyIdToken: vi.fn().mockResolvedValue({ uid: "test-user-id" }),
  },
}));

// Mock bcrypt
vi.mock("bcrypt", () => {
  return {
    compare: vi.fn().mockResolvedValue(true),
  };
});

describe("POST /api/auth/login", () => {
  let mockRequest: NextRequest;
  let mockCollectionRef: {
    where: MockedFunction<(...args: unknown[]) => unknown>;
    doc: MockedFunction<(...args: unknown[]) => unknown>;
  };
  let mockQueryRef: { get: MockedFunction<() => unknown> };
  let mockQuerySnapshot: { empty: boolean; docs: Array<unknown> };
  let mockDocRef: { get: MockedFunction<() => unknown> };
  let mockUserDoc: {
    id: string;
    data: MockedFunction<() => unknown>;
    ref: { update: MockedFunction<() => unknown> };
  };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Mock document data
    mockUserDoc = {
      id: "test-user-id",
      data: vi.fn().mockReturnValue({
        passwordHash: "hashed_password",
      }),
      ref: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    // Mock Firestore query
    mockQuerySnapshot = {
      empty: false,
      docs: [mockUserDoc],
    };
    mockQueryRef = {
      get: vi.fn().mockResolvedValue(mockQuerySnapshot),
    };
    mockDocRef = {
      get: vi.fn().mockResolvedValue(mockUserDoc),
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

    // Create mock request
    mockRequest = {
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

  it("should return 401 if user is not found", async () => {
    // Override the mock to simulate user not found
    mockQuerySnapshot.empty = true;
    mockQuerySnapshot.docs = [];

    const response = await POST(mockRequest);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Invalid username or password");
  });

  it("should return 401 if password hash is not found", async () => {
    // Override the mock to simulate missing password hash
    mockUserDoc.data = vi.fn().mockReturnValue({});

    const response = await POST(mockRequest);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Authentication failed: Password hash not found");
  });
});
