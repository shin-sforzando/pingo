import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env (public variables)
const publicEnvPath = resolve(process.cwd(), ".env");
const publicResult = config({ path: publicEnvPath });
if (publicResult.error) {
  console.error(
    `Failed to load public environment variables from ${publicEnvPath}:`,
    publicResult.error,
  );
}

// Load environment variables from .env.local (private variables, will override .env)
const privateEnvPath = resolve(process.cwd(), ".env.local");
const privateResult = config({ path: privateEnvPath });
if (privateResult.error) {
  console.error(
    `Failed to load private environment variables from ${privateEnvPath}:`,
    privateResult.error,
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
