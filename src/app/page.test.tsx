import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home component", () => {
  it("renders without crashing", () => {
    // This is a simple test to check if the component renders without throwing an error
    expect(() => <Home />).not.toThrow();
  });
});
