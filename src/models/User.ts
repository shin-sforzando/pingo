import { z } from "zod";
import { timestampSchema } from "./Timestamp";

/**
 * User schema definition using Zod
 */
export const userSchema = z.object({
  id: z.string(),
  username: z
    .string()
    .min(3)
    .max(20)
    .refine((val) => !/[.$/]/.test(val), {
      message: "Username contains invalid characters",
    }),
  passwordHash: z.string(),
  createdAt: timestampSchema,
  lastLoginAt: timestampSchema,
  participatingGames: z.array(z.string()).default([]),
  gameHistory: z.array(z.string()).default([]),
  memo: z.string().default(""),
  isTestUser: z.boolean().default(false),
});

/**
 * User type derived from Zod schema
 */
export type User = z.infer<typeof userSchema>;

/**
 * Firestore converter for User type
 */
export const userConverter = {
  toFirestore: (user: User) => {
    // Convert User object to Firestore document
    return {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt, // Already Timestamp
      lastLoginAt: user.lastLoginAt, // Already Timestamp
      participatingGames: user.participatingGames,
      gameHistory: user.gameHistory,
      memo: user.memo,
      isTestUser: user.isTestUser,
    };
  },
  fromFirestore: (
    snapshot: {
      data: (options?: unknown) => Record<string, unknown> | undefined;
    },
    options?: unknown,
  ) => {
    const data = snapshot.data(options);

    if (!data) {
      throw new Error("Document data is undefined");
    }

    // Parse and validate with Zod schema
    return userSchema.parse({
      id: data.id,
      username: data.username,
      passwordHash: data.passwordHash,
      createdAt: data.createdAt, // Firestore Timestamp
      lastLoginAt: data.lastLoginAt, // Firestore Timestamp
      participatingGames: data.participatingGames || [],
      gameHistory: data.gameHistory || [],
      memo: data.memo || "",
      isTestUser: data.isTestUser || false,
    });
  },
};
