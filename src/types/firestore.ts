import type { Timestamp as AdminTimestamp } from "firebase-admin/firestore";
/**
 * Common type definitions for Firestore
 */
import { Timestamp as ClientTimestamp } from "firebase/firestore";

/**
 * Common interface for both client and admin Timestamp
 * This allows us to work with timestamps in a consistent way
 */
export interface TimestampInterface {
  toDate(): Date;
  toMillis(): number;
  isEqual(other: TimestampInterface): boolean;
  valueOf(): string;
}

/**
 * Type guard to check if a value is a client Timestamp
 */
export function isClientTimestamp(
  timestamp: unknown,
): timestamp is ClientTimestamp {
  return (
    timestamp !== null &&
    timestamp !== undefined &&
    typeof (timestamp as ClientTimestamp).toDate === "function" &&
    typeof (timestamp as ClientTimestamp).nanoseconds === "number" &&
    !("_seconds" in (timestamp as object))
  );
}

/**
 * Type guard to check if a value is an admin Timestamp
 */
export function isAdminTimestamp(
  timestamp: unknown,
): timestamp is AdminTimestamp {
  return (
    timestamp !== null &&
    timestamp !== undefined &&
    typeof (timestamp as AdminTimestamp).toDate === "function" &&
    "_seconds" in (timestamp as object)
  );
}

/**
 * Type guard to check if a value is any kind of Timestamp
 */
export function isTimestamp(
  timestamp: unknown,
): timestamp is TimestampInterface {
  return isClientTimestamp(timestamp) || isAdminTimestamp(timestamp);
}

/**
 * Convert a Timestamp to a Date
 */
export function timestampToDate(
  timestamp: TimestampInterface | null | undefined,
): Date | null {
  return timestamp ? timestamp.toDate() : null;
}

/**
 * Convert a Date to a client Timestamp
 * Note: This should only be used in client-side code
 */
export function dateToClientTimestamp(
  date: Date | null | undefined,
): ClientTimestamp | null {
  return date ? ClientTimestamp.fromDate(date) : null;
}

/**
 * Convert a Timestamp to an ISO string
 */
export function timestampToISOString(
  timestamp: TimestampInterface | null | undefined,
): string | null {
  return timestamp ? timestamp.toDate().toISOString() : null;
}

/**
 * Base document interface with timestamp fields
 */
export interface BaseDocument {
  createdAt: TimestampInterface;
  updatedAt?: TimestampInterface | null;
}

/**
 * Base model interface with Date fields
 */
export interface BaseModel {
  createdAt: Date;
  updatedAt?: Date | null;
}

/**
 * Convert document timestamps to model dates
 */
export function convertTimestampsToDate<T extends Record<string, unknown>>(
  data: T,
): T {
  if (!data) return data;

  // Create a new object to avoid mutating the original
  const result = {} as Record<string, unknown>;

  // Process each property
  for (const [key, value] of Object.entries(data)) {
    // Convert Timestamp fields to Date
    if (isTimestamp(value)) {
      result[key] = timestampToDate(value);
    }
    // Handle nested objects recursively
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = convertTimestampsToDate(value as Record<string, unknown>);
    }
    // Handle arrays of objects
    else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object"
          ? convertTimestampsToDate(item as Record<string, unknown>)
          : item,
      );
    }
    // Keep other values as is
    else {
      result[key] = value;
    }
  }

  return result as T;
}
