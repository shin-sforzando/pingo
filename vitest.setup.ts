import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

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
