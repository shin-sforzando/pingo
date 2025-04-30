import { userSchema } from "@/lib/validators/models/user";
import type React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";

// Define the expected shape of the user data fetched from the API
type UserInfoData = z.infer<typeof userSchema> | null;

/**
 * A simple component that fetches and displays the current user's information.
 * from the /api/auth/session endpoint.
 */
export const CurrentUserInfo: React.FC = () => {
  const [user, setUser] = useState<UserInfoData>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          if (response.status === 401) {
            // Not logged in, expected state
            setUser(null);
          } else {
            throw new Error(
              `API Error: ${response.status} ${response.statusText}`,
            );
          }
        } else {
          const data = await response.json();
          if (data === null) {
            setUser(null);
          } else {
            // Validate the received data against our schema
            // We need a schema that handles date strings from JSON
            const userApiResponseSchema = userSchema.extend({
              createdAt: z.preprocess(
                (arg) => (typeof arg === "string" ? new Date(arg) : arg),
                z.date(),
              ),
              lastLoginAt: z.preprocess(
                (arg) => (typeof arg === "string" ? new Date(arg) : arg),
                z.date(),
              ),
            });
            const parsed = userApiResponseSchema.safeParse(data);
            if (parsed.success) {
              setUser(parsed.data);
            } else {
              console.error("Invalid user data received:", parsed.error);
              throw new Error("Invalid user data received from API.");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user session:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setUser(null); // Clear user data on error
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // Fetch only once on mount

  if (loading) {
    return <div>Loading user info...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error loading info: {error}</div>;
  }

  if (!user) {
    return <div>No user logged in.</div>;
  }

  return (
    <div
      style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}
    >
      <h2 className="text-2xl">Current User Info</h2>
      <p>
        <span className="font-semibold">ID:</span> {user.id}
      </p>
      <p>
        <span className="font-semibold">Handle:</span> {user.handle}
      </p>
      <p>
        <span className="font-semibold">Joined:</span>{" "}
        {user.createdAt.toLocaleDateString()}
      </p>
      <p>
        <span className="font-semibold">Last Login:</span>{" "}
        {user.lastLoginAt.toLocaleString()}
      </p>
    </div>
  );
};
