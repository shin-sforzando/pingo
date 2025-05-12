import { NextResponse } from "next/server";

export async function GET() {
  try {
    const nodeVersion = process.version;
    const environment = process.env.NODE_ENV || "development";
    const resourceUsage = process.resourceUsage();
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    const NEXT_PUBLIC_FIREBASE_API_KEY =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    const healthStatus = {
      status: "ok",
      nodeVersion,
      environment,
      resourceUsage,
      uptime,
      timestamp,
      firebaseApiKey: NEXT_PUBLIC_FIREBASE_API_KEY,
    };
    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error("Error fetching health status:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve health status" },
      { status: 500 },
    );
  }
}
