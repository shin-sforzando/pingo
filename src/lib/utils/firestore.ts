import { Timestamp as FirestoreAdminTimestamp } from "firebase-admin/firestore";
import { Timestamp as FirestoreClientTimestamp } from "firebase/firestore";
import type { z } from "zod";
import type { DateOrFirestoreTimestamp } from "../validators/common";
import {
  dateOrFirestoreTimestampSchema,
  firestoreTimestampSchema,
  timestampSchema,
} from "../validators/common";

// Define a type that accepts both client and admin Timestamps for broader compatibility
// This helps in creating utility functions that work regardless of the specific Firestore SDK context.
type FirestoreTimestampType =
  | FirestoreAdminTimestamp
  | FirestoreClientTimestamp;

/**
 * Converts a JavaScript Date object or a Firestore Timestamp object/structure
 * into a JavaScript Date object.
 * This function is crucial for normalizing timestamp data received from various sources
 * (e.g., Firestore directly, API responses) into a consistent Date format for application use.
 * It handles both Firestore SDK Timestamp objects and plain objects matching the schema.
 * Using this ensures that the rest of the application can reliably work with standard Date objects.
 *
 * @param timestampInput - The input value, which can be a Date, Firestore Timestamp object, or a plain object with seconds/nanoseconds.
 * @returns A JavaScript Date object.
 * @throws {Error} If the input is invalid or cannot be parsed according to the expected schemas.
 */
export function toDate(
  timestampInput: DateOrFirestoreTimestamp | FirestoreTimestampType,
): Date {
  // Prioritize checking for actual Firestore Timestamp instances from the SDKs,
  // as they have a built-in .toDate() method which is the most reliable conversion.
  if (
    timestampInput instanceof FirestoreAdminTimestamp ||
    timestampInput instanceof FirestoreClientTimestamp
  ) {
    return timestampInput.toDate();
  }

  // If it's not an SDK instance, validate the input against the combined schema
  // This handles plain JS Date objects and Firestore-like {seconds, nanoseconds} objects.
  const parsed = dateOrFirestoreTimestampSchema.safeParse(timestampInput);
  if (!parsed.success) {
    // Provide a more informative error message including the Zod error details.
    throw new Error(
      `Invalid timestamp input format. Zod errors: ${parsed.error.message}`,
    );
  }

  const data = parsed.data;

  // If the validated data is already a Date object, return it directly.
  if (data instanceof Date) {
    return data;
  }

  // If it's a validated Firestore-like object, convert it to a Date.
  // The conversion formula correctly handles seconds and nanoseconds.
  return new Date(data.seconds * 1000 + data.nanoseconds / 1_000_000);
}

/**
 * Converts a JavaScript Date object into a plain object structure
 * compatible with Firestore's Timestamp ({ seconds: number, nanoseconds: number }).
 * This is useful when preparing data to be sent *to* Firestore, ensuring
 * the correct format is used, especially in environments where the Firestore SDK
 * might not automatically handle the conversion (e.g., serverless functions, specific API layers),
 * or when needing to serialize timestamps in a specific way.
 *
 * @param dateInput - The JavaScript Date object to convert.
 * @returns An object with 'seconds' and 'nanoseconds' properties, conforming to firestoreTimestampSchema.
 * @throws {Error} If the input is not a valid Date object according to timestampSchema.
 */
export function toFirestoreTimestampObject(
  dateInput: Date,
): z.infer<typeof firestoreTimestampSchema> {
  // Validate the input Date first to ensure it's a valid Date object.
  const parsedDate = timestampSchema.safeParse(dateInput);
  if (!parsedDate.success) {
    throw new Error(
      `Invalid Date input for conversion. Zod errors: ${parsedDate.error.message}`,
    );
  }

  const date = parsedDate.data;
  const seconds = Math.floor(date.getTime() / 1000);
  // Calculate nanoseconds precisely from the milliseconds remainder.
  const nanoseconds = (date.getTime() % 1000) * 1_000_000;

  // Validate the resulting object against the Firestore timestamp schema
  // This acts as a final check to guarantee the output format is correct.
  return firestoreTimestampSchema.parse({ seconds, nanoseconds });
}

/**
 * Type guard to reliably check if a given value is an instance of either
 * the Firebase Admin SDK Timestamp or the Firebase Client SDK Timestamp.
 * Useful for differentiating between plain Date objects and Firestore Timestamps
 * in contexts where both might appear, allowing for conditional logic based on the type.
 *
 * @param value - The value to check.
 * @returns True if the value is a Firestore Timestamp instance (admin or client), false otherwise.
 */
export function isFirestoreTimestamp(
  value: unknown,
): value is FirestoreTimestampType {
  return (
    value instanceof FirestoreAdminTimestamp ||
    value instanceof FirestoreClientTimestamp
  );
}
