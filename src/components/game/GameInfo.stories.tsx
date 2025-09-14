import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { GameStatus } from "@/types/common";
import type { Game } from "@/types/schema";
import { GameInfo } from "./GameInfo";

const meta: Meta<typeof GameInfo> = {
  title: "Game/GameInfo",
  component: GameInfo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    game: {
      description: "Game object containing all game information",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseGame: Game = {
  id: faker.string.alphanumeric(6).toUpperCase(), // 6桁英数
  title: "Nature Photography Bingo",
  theme: "Nature and Wildlife",
  creatorId: faker.string.ulid(), // ULID
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:30:00Z"),
  expiresAt: new Date("2024-02-15T23:59:59Z"),
  isPublic: true,
  isPhotoSharingEnabled: true,
  requiredBingoLines: 3,
  confidenceThreshold: 0.7,
  maxSubmissionsPerUser: 30,
  notes: "Take photos of various nature subjects to complete your bingo card!",
  status: GameStatus.ACTIVE,
};

export const ActiveGame: Story = {
  args: {
    game: baseGame,
  },
};

export const EndedGame: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      status: GameStatus.ENDED,
      title: "Completed City Life Bingo",
      theme: "Urban Photography",
      expiresAt: new Date("2024-01-10T23:59:59Z"), // Past date
    },
  },
};

export const PrivateGame: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      isPublic: false,
      isPhotoSharingEnabled: false,
      title: "Private Family Bingo",
      theme: "Family Activities",
      notes: "A private game for family members only.",
      creatorId: faker.string.ulid(),
    },
  },
};

export const HighThresholdGame: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      confidenceThreshold: 0.9,
      requiredBingoLines: 5,
      title: "Expert Photography Challenge",
      theme: "Professional Photography",
      notes:
        "High difficulty game for experienced photographers. Requires very clear and precise photos.",
      creatorId: faker.string.ulid(),
    },
  },
};

export const LowThresholdGame: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      confidenceThreshold: 0.3,
      requiredBingoLines: 1,
      title: "Beginner Friendly Bingo",
      theme: "Everyday Objects",
      notes: "Perfect for beginners! Low threshold for easy completion.",
      creatorId: faker.string.ulid(),
    },
  },
};

export const NoNotesGame: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      notes: undefined,
      title: "Simple Bingo Game",
      theme: "Basic Objects",
      creatorId: faker.string.ulid(),
    },
  },
};

export const LongNotesGame: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      title: "Detailed Photography Bingo",
      theme: "Comprehensive Photography",
      notes:
        "This is a comprehensive photography bingo game that covers various aspects of photography including landscape, portrait, macro, street photography, and more. Players are encouraged to explore different techniques and subjects. The game is designed to help improve photography skills while having fun. Please ensure all photos are original and taken during the game period. Good lighting and composition are important for higher confidence scores.",
      creatorId: faker.string.ulid(),
    },
  },
};

export const ExpiringGame: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      title: "Expiring Soon Bingo",
      theme: "Quick Challenge",
      notes: "This game expires in 24 hours!",
      creatorId: faker.string.ulid(),
    },
  },
};

export const RecentlyCreated: Story = {
  args: {
    game: {
      ...baseGame,
      id: faker.string.alphanumeric(6).toUpperCase(),
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      updatedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      title: "Brand New Bingo",
      theme: "Fresh Start",
      notes: "Just created! Join now while it's fresh.",
      creatorId: faker.string.ulid(),
    },
  },
};
