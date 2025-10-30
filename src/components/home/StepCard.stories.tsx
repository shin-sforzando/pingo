import type { Meta, StoryObj } from "@storybook/react";
import { StepCard } from "./StepCard";

/**
 * StepCard displays a step in the how-to-play guide with title, description, and screenshot image.
 * Used in the home page to show game instructions.
 */
const meta = {
  title: "Home/StepCard",
  component: StepCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default step card with registration instructions
 */
export const Default: Story = {
  args: {
    title: "Register an Account",
    description:
      "Let's start by creating a user account. Enter your username, email address, and password, then click the 'Register' button.",
    imageSrc: "/images/howtoplay/00-register.png",
    imageAlt: "Register an Account",
  },
};

/**
 * Step card with longer description text
 */
export const LongDescription: Story = {
  args: {
    title: "Upload and Submit Photos",
    description:
      "When you're ready to play, take photos of items that match the subjects on your bingo board. Make sure your photos are clear and well-lit for the best results. The AI will analyze your photo to verify if it matches the subject. After uploading, you'll receive immediate feedback on whether your submission was accepted or if you need to try again with a different photo.",
    imageSrc: "/images/howtoplay/06-image-selected.png",
    imageAlt: "Upload and Submit Photos",
  },
};

/**
 * Japanese language content
 */
export const JapaneseContent: Story = {
  args: {
    title: "アカウントを登録",
    description:
      "まずはユーザー登録をしよう。ユーザー名、メールアドレス、パスワードを入力して「登録」ボタンをクリックしてね。",
    imageSrc: "/images/howtoplay/00-register.png",
    imageAlt: "アカウントを登録",
  },
};

/**
 * Create game step
 */
export const CreateGame: Story = {
  args: {
    title: "Generate Game Board",
    description:
      "Click the 'Generate Subjects' button to have the AI create random subjects for your bingo game. You can regenerate if you want different subjects.",
    imageSrc: "/images/howtoplay/03-create-game-with-subjects.png",
    imageAlt: "Generate Game Board",
  },
};

/**
 * Join game step
 */
export const JoinGame: Story = {
  args: {
    title: "Enter Game ID",
    description:
      "To join a game, enter the Game ID shared by the host and click 'Join Game'.",
    imageSrc: "/images/howtoplay/05-bingo-board.png",
    imageAlt: "Enter Game ID",
  },
};

/**
 * Multiple steps displayed together
 */
export const MultipleSteps: Story = {
  decorators: [
    (_Story) => (
      <div className="grid max-w-4xl gap-6">
        <StepCard
          title="Register an Account"
          description="Let's start by creating a user account. Enter your username and password."
          imageSrc="/images/howtoplay/00-register.png"
          imageAlt="Register an Account"
        />
        <StepCard
          title="Create a Game"
          description="Click the 'Create Game' button to start setting up your bingo game."
          imageSrc="/images/howtoplay/02-create-game-empty.png"
          imageAlt="Create a Game"
        />
        <StepCard
          title="Generate Subjects"
          description="Have the AI create random subjects for your bingo board."
          imageSrc="/images/howtoplay/03-create-game-with-subjects.png"
          imageAlt="Generate Subjects"
        />
      </div>
    ),
  ],
  // Empty args since we're using decorator to show multiple cards
  args: {
    title: "",
    description: "",
    imageSrc: "",
    imageAlt: "",
  },
};
