// Test script for updating a user
// This script can be run with tsx: npx tsx test-update-api.ts

async function updateUser() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "01JTZ9Z2EQ3352HBTYMSXNM42A",
        username: "newtestuser",
      }),
    });

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

updateUser();
