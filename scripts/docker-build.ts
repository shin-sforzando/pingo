#!/usr/bin/env tsx

/**
 * Docker Build & Run Script
 *
 * This script extracts credentials from Firebase Admin SDK JSON files
 * and provides a cross-platform way to build and run Docker containers
 * with proper environment variables.
 */

import type { ExecSyncOptions } from "node:child_process";
import { execSync } from "node:child_process";
import * as fs from "node:fs/promises";

// Constants
const FIREBASE_ADMIN_SDK_FILE =
  "pingo-456817-firebase-adminsdk-fbsvc-94b63a9da5.json";

// Firebase credentials interface
interface FirebaseCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// Extract Firebase credentials from JSON
async function extractFirebaseCredentials(
  jsonFilePath: string,
): Promise<FirebaseCredentials> {
  try {
    const content = await fs.readFile(jsonFilePath, "utf-8");
    const json = JSON.parse(content) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    return {
      projectId: json.project_id,
      clientEmail: json.client_email,
      privateKey: json.private_key,
    };
  } catch (error) {
    console.error(
      `Error reading Firebase credentials from ${jsonFilePath}:`,
      error,
    );
    throw new Error("Failed to extract Firebase credentials");
  }
}

// Process command arguments
function parseArguments(args: string[]): {
  runContainer: boolean;
} {
  return {
    runContainer: args.includes("--run"),
  };
}

// Main function
async function main(): Promise<void> {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  const { runContainer } = parseArguments(args);

  // We don't need to load environment variables here as Docker handles env files
  // directly with --env-file flag when running the container

  // Check if Firebase Admin SDK file exists
  try {
    await fs.access(FIREBASE_ADMIN_SDK_FILE);
  } catch (_error) {
    console.warn(
      `Warning: Firebase Admin SDK file ${FIREBASE_ADMIN_SDK_FILE} not found.`,
    );
    console.warn("Make sure the file exists in the current directory.");
    process.exit(1);
  }

  // Extract Firebase credentials
  const credentials = await extractFirebaseCredentials(FIREBASE_ADMIN_SDK_FILE);

  // Build Docker command with template literals
  const escapedPrivateKey = credentials.privateKey.replace(/\n/g, "\\n");

  const buildCmd = `docker build --no-cache --progress=plain --tag pingo:latest . --file Dockerfile --build-arg FIREBASE_PROJECT_ID="${credentials.projectId}" --build-arg FIREBASE_CLIENT_EMAIL="${credentials.clientEmail}" --build-arg FIREBASE_PRIVATE_KEY="${escapedPrivateKey}"`;

  // Execute build
  console.log("Building Docker image...");
  try {
    const execOptions: ExecSyncOptions = { stdio: "inherit" };
    execSync(buildCmd, execOptions);
    console.log("Docker image built successfully!");

    // Run container if requested
    if (runContainer) {
      console.log("Running container...");
      execSync(
        "docker run --publish 8080:8080 --env-file .env --env-file .env.local pingo:latest",
        execOptions,
      );
    }
  } catch (error) {
    console.error("Error building or running Docker image:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
