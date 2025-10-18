import { page, userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { GameInfo } from "@/types/schema";
import { GameInfoCard } from "./GameInfoCard";

describe("GameInfoCard", () => {
  const mockGame: GameInfo = {
    id: "ABC123",
    title: "Summer Adventure",
    theme: "Beach activities",
    notes: "Family friendly game",
    participantCount: 5,
    createdAt: new Date("2024-01-01"),
    expiresAt: new Date("2099-12-31"),
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render game title and ID", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      expect(page.getByText("Summer Adventure")).toBeDefined();
      expect(page.getByText("ABC123")).toBeDefined();
    });

    it("should render game theme", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      expect(page.getByText("Beach activities")).toBeDefined();
    });

    it("should render notes when provided", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      expect(page.getByText("Family friendly game")).toBeDefined();
    });

    it("should not render notes section when notes are not provided", async () => {
      const gameWithoutNotes: GameInfo = {
        ...mockGame,
        notes: undefined,
      };

      const { container } = render(
        <GameInfoCard
          game={gameWithoutNotes}
          onClick={mockOnClick}
          locale="en"
        />,
      );

      // Check that notes text is not present in the rendered output
      expect(container.textContent).not.toContain("Family friendly game");
    });

    it("should render participant count when provided", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      expect(page.getByText("5")).toBeDefined();
    });

    it("should not render participant count when undefined", async () => {
      const gameWithoutParticipants: GameInfo = {
        ...mockGame,
        participantCount: undefined,
      };

      const { container } = render(
        <GameInfoCard
          game={gameWithoutParticipants}
          onClick={mockOnClick}
          locale="en"
        />,
      );

      // Check that Users icon is not present
      const usersIcon = container.querySelector('svg[class*="lucide-users"]');
      expect(usersIcon).toBeNull();
    });

    it("should render expiration date when provided", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      // Should show relative time like "in X years"
      expect(page.getByText(/in \d+ years?/)).toBeDefined();
    });

    it("should not render expiration date when null", async () => {
      const gameWithoutExpiry: GameInfo = {
        ...mockGame,
        expiresAt: null,
      };

      const { container } = render(
        <GameInfoCard
          game={gameWithoutExpiry}
          onClick={mockOnClick}
          locale="en"
        />,
      );

      // Check that Calendar icon is not present
      const calendarIcon = container.querySelector(
        'svg[class*="lucide-calendar"]',
      );
      expect(calendarIcon).toBeNull();
    });
  });

  describe("interaction", () => {
    it("should call onClick handler when card is clicked", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      const card = page.getByText("Summer Adventure");
      await userEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockGame);
    });

    it("should have hover effect styles", async () => {
      const { container } = render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      const card = container.querySelector('[class*="cursor-pointer"]');
      expect(card).toBeDefined();
      expect(card?.className).toContain("hover:bg-muted/50");
    });
  });

  describe("locale handling", () => {
    it("should use Japanese locale for date formatting when locale is ja", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="ja" />,
      );

      // Japanese should show "X年後" format
      expect(page.getByText(/\d+年後/)).toBeDefined();
    });

    it("should use English locale for date formatting when locale is en", async () => {
      render(
        <GameInfoCard game={mockGame} onClick={mockOnClick} locale="en" />,
      );

      // English should show "in X years" format
      expect(page.getByText(/in \d+ years?/)).toBeDefined();
    });
  });

  describe("custom className", () => {
    it("should apply custom className to card", async () => {
      const { container } = render(
        <GameInfoCard
          game={mockGame}
          onClick={mockOnClick}
          locale="en"
          className="custom-class"
        />,
      );

      const card = container.querySelector(".custom-class");
      expect(card).toBeDefined();
    });
  });
});
