import { NextResponse } from "next/server";
import { dateToISOString } from "@/types/firestore";

export async function GET() {
  try {
    const nodeVersion = process.version;
    const environment = process.env.NODE_ENV || "development";
    const resourceUsage = process.resourceUsage();
    const uptime = process.uptime();
    const timestamp = dateToISOString(new Date());

    const healthStatus = {
      status: "ok",
      nodeVersion,
      environment,
      resourceUsage,
      uptime,
      timestamp,
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
