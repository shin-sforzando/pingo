import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import type { GameInfo } from "@/types/schema";
import { GameInfoCard } from "./GameInfoCard";

/**
 * GameInfoCard displays a clickable card with game information.
 * Used in game join page for both participating and available games.
 */
const meta = {
  title: "Game/GameInfoCard",
  component: GameInfoCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    locale: {
      control: "select",
      options: ["ja", "en"],
      description: "Locale for date formatting",
    },
  },
  args: {
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const futureDate = new Date();
futureDate.setMonth(futureDate.getMonth() + 3);

const pastDate = new Date();
pastDate.setMonth(pastDate.getMonth() - 1);

/**
 * Full game information with all optional fields
 */
export const FullInfo: Story = {
  args: {
    game: {
      id: "ABC123",
      title: "Summer Adventure Bingo",
      theme: "Beach and outdoor activities",
      notes: "Perfect for summer vacation! Family friendly.",
      participantCount: 12,
      createdAt: new Date(),
      expiresAt: futureDate,
    } satisfies GameInfo,
    locale: "en",
  },
};

/**
 * Minimal game information without optional fields
 */
export const MinimalInfo: Story = {
  args: {
    game: {
      id: "XYZ789",
      title: "City Explorer",
      theme: "Urban landmarks",
      createdAt: new Date(),
      expiresAt: futureDate,
    } satisfies GameInfo,
    locale: "en",
  },
};

/**
 * Game with long notes text
 */
export const LongNotes: Story = {
  args: {
    game: {
      id: "DEF456",
      title: "Nature Photography",
      theme: "Wildlife and landscapes",
      notes:
        "This is a comprehensive nature photography bingo game designed for photography enthusiasts. Take pictures of various wildlife, landscapes, and natural phenomena throughout the season.",
      participantCount: 8,
      createdAt: new Date(),
      expiresAt: futureDate,
    } satisfies GameInfo,
    locale: "en",
  },
};

/**
 * Game expiring soon
 */
export const ExpiringSoon: Story = {
  args: {
    game: {
      id: "URG111",
      title: "Last Chance Bingo",
      theme: "Seasonal items",
      notes: "Hurry up! Ending soon.",
      participantCount: 5,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    } satisfies GameInfo,
    locale: "en",
  },
};

/**
 * Japanese locale
 */
export const JapaneseLocale: Story = {
  args: {
    game: {
      id: "JP0001",
      title: "東京探検ビンゴ",
      theme: "東京の名所",
      notes: "家族で楽しめるゲームです",
      participantCount: 18,
      createdAt: new Date(),
      expiresAt: futureDate,
    } satisfies GameInfo,
    locale: "ja",
  },
};

/**
 * Verified game display (after ID verification, before joining)
 * Shows actual participant count from the game
 */
export const VerifiedGame: Story = {
  args: {
    game: {
      id: "EVXSTJ",
      title: "COSTCO",
      theme: "川崎店",
      participantCount: 2,
      createdAt: null,
      expiresAt: new Date("2025-10-31"),
    } satisfies GameInfo,
    locale: "ja",
  },
};
