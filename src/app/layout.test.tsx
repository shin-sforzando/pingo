import RootLayout from "@/app/layout";
import Home from "@/app/page";
import { describe, expect, it } from "vitest";

describe("RootLayout component", () => {
  it("renders without crashing w/ Home", () => {
    // This is a simple test to check if the component renders without throwing an error
    expect(() => (
      <RootLayout>
        <Home />
      </RootLayout>
    )).not.toThrow();
  });
});
