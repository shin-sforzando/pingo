import { describe } from "node:test";
import { expect, it } from "vitest";
import RootLayout from "./layout";
import Home from "./page";

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
