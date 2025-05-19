/**
 * Common type definitions for Firestore
 */
import { Timestamp as AdminTimestamp } from "firebase-admin/firestore";
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
 * Convert a Date to an admin Timestamp
 * Note: This should only be used in server-side code
 */
export function dateToAdminTimestamp(
  date: Date | null | undefined,
): AdminTimestamp | null {
  return date ? AdminTimestamp.fromDate(date) : null;
}

/**
 * Convert a Date to a Timestamp based on the environment
 * This function should be used in code that can run in both client and server environments
 */
export function dateToTimestamp(
  date: Date | null | undefined,
): TimestampInterface | null {
  // Check if we're in a server environment
  if (typeof window === "undefined") {
    // Server-side: use Admin SDK
    return dateToAdminTimestamp(date);
  }
  // Client-side: use Client SDK
  return dateToClientTimestamp(date);
}

/**
 * Convert a Date to a non-null Timestamp based on the environment
 * This function should be used when a non-null Timestamp is required
 * @throws Error if date is null or undefined
 */
export function nonNullDateToTimestamp(date: Date): TimestampInterface {
  if (!date) {
    throw new Error("Date cannot be null or undefined");
  }

  // Check if we're in a server environment
  if (typeof window === "undefined") {
    // Server-side: use Admin SDK
    const timestamp = AdminTimestamp.fromDate(date);
    return timestamp as TimestampInterface;
  }
  // Client-side: use Client SDK
  const timestamp = ClientTimestamp.fromDate(date);
  return timestamp as TimestampInterface;
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
