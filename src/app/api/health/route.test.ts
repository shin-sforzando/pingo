import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("/api/health endpoint", () => {
  // Mock Node.js APIs
  const mockResourceUsage = {
    userCPUTime: 1000,
    systemCPUTime: 500,
    maxRSS: 10000,
    sharedMemorySize: 0,
    unsharedDataSize: 0,
    unsharedStackSize: 0,
    minorPageFault: 0,
    majorPageFault: 0,
    swappedOut: 0,
    fsRead: 0,
    fsWrite: 0,
    ipcSent: 0,
    ipcReceived: 0,
    signalsCount: 0,
    voluntaryContextSwitches: 0,
    involuntaryContextSwitches: 0,
  };

  const mockUptime = 3600; // 1 hour
  const mockNodeVersion = "v22.15.0";
  const mockEnv = "test";
  const mockDate = new Date("2025-05-06T12:00:00Z");

  // Setup spies and mocks
  beforeEach(() => {
    vi.spyOn(process, "resourceUsage").mockReturnValue(mockResourceUsage);
    vi.spyOn(process, "uptime").mockReturnValue(mockUptime);
    vi.spyOn(process, "version", "get").mockReturnValue(mockNodeVersion);
    vi.stubEnv("NODE_ENV", mockEnv);
    vi.spyOn(global, "Date").mockImplementation(() => mockDate as Date);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // Reset mocks after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 200 status code and health information when successful", async () => {
    // Execute
    const response = await GET();

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toEqual({
      status: "ok",
      resourceUsage: mockResourceUsage,
      uptime: mockUptime,
      nodeVersion: mockNodeVersion,
      environment: mockEnv,
      timestamp: mockDate.toISOString(),
    });

    // Verify process.resourceUsage was called
    expect(process.resourceUsage).toHaveBeenCalledTimes(1);
    // Verify process.uptime was called
    expect(process.uptime).toHaveBeenCalledTimes(1);
  });

  it("should return 500 status code and error message when an error occurs", async () => {
    // Mock to throw an error
    vi.spyOn(process, "resourceUsage").mockImplementation(() => {
      throw new Error("Failed to get resource information");
    });

    // Execute
    const response = await GET();

    // Verify
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);

    const responseData = await response.json();
    expect(responseData).toEqual({
      status: "error",
      message: "Failed to retrieve health status",
    });

    // Verify console.error was called
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching health status:",
      expect.any(Error),
    );
  });
});
