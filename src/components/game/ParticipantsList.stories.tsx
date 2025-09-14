import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Role } from "@/types/common";
import { ParticipantsList } from "./ParticipantsList";

const meta: Meta<typeof ParticipantsList> = {
  title: "Game/ParticipantsList",
  component: ParticipantsList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    participants: {
      description: "Array of participants in the game",
    },
    currentUserId: {
      description: "ID of the current user to highlight",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const generateParticipant = (role: Role, completedLines = 0) => ({
  id: faker.string.ulid(),
  username: faker.internet.username(),
  role,
  joinedAt: faker.date.recent({ days: 7 }),
  completedLines,
  lastCompletedAt: 0 < completedLines ? faker.date.recent({ days: 1 }) : null,
});

const sampleParticipants = [
  {
    id: faker.string.ulid(),
    username: "photographer_pro",
    role: Role.CREATOR,
    joinedAt: new Date("2024-01-15T10:00:00Z"),
    completedLines: 5,
    lastCompletedAt: new Date("2024-01-16T14:30:00Z"),
  },
  {
    id: faker.string.ulid(),
    username: "nature_lover",
    role: Role.ADMIN,
    joinedAt: new Date("2024-01-15T11:30:00Z"),
    completedLines: 3,
    lastCompletedAt: new Date("2024-01-16T12:15:00Z"),
  },
  {
    id: faker.string.ulid(),
    username: "camera_newbie",
    role: Role.PARTICIPANT,
    joinedAt: new Date("2024-01-15T15:45:00Z"),
    completedLines: 1,
    lastCompletedAt: new Date("2024-01-16T09:20:00Z"),
  },
  {
    id: faker.string.ulid(),
    username: "photo_enthusiast",
    role: Role.PARTICIPANT,
    joinedAt: new Date("2024-01-16T08:20:00Z"),
    completedLines: 2,
    lastCompletedAt: new Date("2024-01-16T16:45:00Z"),
  },
  {
    id: faker.string.ulid(),
    username: "beginner_snapper",
    role: Role.PARTICIPANT,
    joinedAt: new Date("2024-01-16T12:10:00Z"),
    completedLines: 0,
    lastCompletedAt: null,
  },
];

export const WithParticipants: Story = {
  args: {
    participants: sampleParticipants,
    currentUserId: sampleParticipants[2].id, // camera_newbie
  },
};

export const EmptyList: Story = {
  args: {
    participants: [],
    currentUserId: undefined,
  },
};

export const SingleParticipant: Story = {
  args: {
    participants: [sampleParticipants[0]],
    currentUserId: sampleParticipants[0].id,
  },
};

export const CreatorOnly: Story = {
  args: {
    participants: [
      {
        id: faker.string.ulid(),
        username: "game_creator",
        role: Role.CREATOR,
        joinedAt: new Date("2024-01-15T10:00:00Z"),
        completedLines: 0,
        lastCompletedAt: null,
      },
    ],
    currentUserId: undefined,
  },
};

export const ManyParticipants: Story = {
  args: {
    participants: [
      generateParticipant(Role.CREATOR, 5),
      generateParticipant(Role.ADMIN, 4),
      generateParticipant(Role.ADMIN, 3),
      ...Array.from({ length: 8 }, () =>
        generateParticipant(
          Role.PARTICIPANT,
          faker.number.int({ min: 0, max: 5 }),
        ),
      ),
    ],
    currentUserId: undefined,
  },
};

export const HighCompletionRates: Story = {
  args: {
    participants: [
      {
        id: faker.string.ulid(),
        username: "bingo_master",
        role: Role.CREATOR,
        joinedAt: new Date("2024-01-15T10:00:00Z"),
        completedLines: 12,
        lastCompletedAt: new Date("2024-01-16T18:30:00Z"),
      },
      {
        id: faker.string.ulid(),
        username: "speed_photographer",
        role: Role.PARTICIPANT,
        joinedAt: new Date("2024-01-15T14:00:00Z"),
        completedLines: 8,
        lastCompletedAt: new Date("2024-01-16T17:45:00Z"),
      },
      {
        id: faker.string.ulid(),
        username: "consistent_player",
        role: Role.PARTICIPANT,
        joinedAt: new Date("2024-01-15T16:30:00Z"),
        completedLines: 6,
        lastCompletedAt: new Date("2024-01-16T15:20:00Z"),
      },
    ],
    currentUserId: undefined,
  },
};

export const NoCompletions: Story = {
  args: {
    participants: [
      {
        id: faker.string.ulid(),
        username: "just_started",
        role: Role.CREATOR,
        joinedAt: new Date("2024-01-16T18:00:00Z"),
        completedLines: 0,
        lastCompletedAt: null,
      },
      {
        id: faker.string.ulid(),
        username: "still_learning",
        role: Role.PARTICIPANT,
        joinedAt: new Date("2024-01-16T18:30:00Z"),
        completedLines: 0,
        lastCompletedAt: null,
      },
      {
        id: faker.string.ulid(),
        username: "taking_time",
        role: Role.PARTICIPANT,
        joinedAt: new Date("2024-01-16T19:00:00Z"),
        completedLines: 0,
        lastCompletedAt: null,
      },
    ],
    currentUserId: undefined,
  },
};

export const CurrentUserHighlighted: Story = {
  args: {
    participants: sampleParticipants,
    currentUserId: sampleParticipants[0].id, // photographer_pro (creator)
  },
};

export const LongUsernames: Story = {
  args: {
    participants: [
      {
        id: faker.string.ulid(),
        username: "very_long_username_that_might_overflow",
        role: Role.CREATOR,
        joinedAt: new Date("2024-01-15T10:00:00Z"),
        completedLines: 3,
        lastCompletedAt: new Date("2024-01-16T14:30:00Z"),
      },
      {
        id: faker.string.ulid(),
        username: "another_extremely_long_username_example",
        role: Role.PARTICIPANT,
        joinedAt: new Date("2024-01-15T12:00:00Z"),
        completedLines: 1,
        lastCompletedAt: new Date("2024-01-16T10:15:00Z"),
      },
    ],
    currentUserId: undefined,
  },
};
