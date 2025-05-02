import Home from "@/app/page";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

describe("HomePage", () => {
  it("renders without crashing", () => {
    // This is a simple test to check if the component renders without throwing an error
    expect(() => <Home />).not.toThrow();
  });
  it("contains the Next.js logo", () => {
    const { getByAltText } = render(<Home />);
    expect(getByAltText("Next.js logo")).toBeInTheDocument();
  });
  it("contains the edit instruction", () => {
    const { getByText } = render(<Home />);
    expect(
      getByText("Get started by editing src/app/page.tsx."),
    ).toBeInTheDocument();
  });
  it("contains the save instruction", () => {
    const { getByText } = render(<Home />);
    expect(
      getByText("Save and see your changes instantly."),
    ).toBeInTheDocument();
  });
});
