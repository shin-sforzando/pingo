import { Timestamp as FirestoreAdminTimestamp } from "firebase-admin/firestore";
import { Timestamp as FirestoreClientTimestamp } from "firebase/firestore";
import {
  dateOrFirestoreTimestampSchema,
  timestampSchema,
} from "../validators/common";

type FirestoreTimestampType =
  | FirestoreAdminTimestamp
  | FirestoreClientTimestamp;

export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;

  if (isFirestoreTimestamp(value)) {
    return value.toDate();
  }

  const parsed = dateOrFirestoreTimestampSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `Invalid timestamp input format. Zod errors: ${parsed.error.message}`,
    );
  }

  const data = parsed.data;
  if (data instanceof Date) return data;

  return new FirestoreClientTimestamp(data.seconds, data.nanoseconds).toDate();
}

export function toFirestoreTimestamp(date: Date): FirestoreClientTimestamp {
  const parsedDate = timestampSchema.safeParse(date);
  if (!parsedDate.success) {
    throw new Error(
      `Invalid Date input for conversion. Zod errors: ${parsedDate.error.message}`,
    );
  }

  return FirestoreClientTimestamp.fromDate(parsedDate.data);
}

export function isFirestoreTimestamp(
  value: unknown,
): value is FirestoreTimestampType {
  return (
    value instanceof FirestoreAdminTimestamp ||
    value instanceof FirestoreClientTimestamp
  );
}
