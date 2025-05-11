import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), ".env.local");
const result = config({ path: envPath });
if (result.error) {
  console.error(
    `Failed to load environment variables from ${envPath}:`,
    result.error,
  );
}

// Log key environment variables to verify they are loaded
// (without revealing sensitive values)
console.log("Environment setup for testing:");
console.log(
  "- GOOGLE_CLOUD_PROJECT_ID:",
  process.env.GOOGLE_CLOUD_PROJECT_ID ? "[Set]" : "[Not Set]",
);
console.log(
  "- GOOGLE_APPLICATION_CREDENTIALS:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS ? "[Set]" : "[Not Set]",
);
console.log(
  "- NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "[Set]" : "[Not Set]",
);
