import type { Meta, StoryObj } from "@storybook/nextjs";
import { SubmissionResult } from "./SubmissionResult";

const meta: Meta<typeof SubmissionResult> = {
  title: "Game/SubmissionResult",
  component: SubmissionResult,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    confidence: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "AI confidence score (0-1)",
    },
    confidenceThreshold: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "Game confidence threshold (0-1)",
    },
    acceptanceStatus: {
      control: { type: "select" },
      options: ["accepted", "no_match", "inappropriate_content"],
      description: "Final acceptance status",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Accepted: Story = {
  args: {
    confidence: 0.85,
    critique:
      "The image clearly shows a red apple on a wooden table. The apple is the main subject of the photo and matches the 'apple' cell perfectly. The image quality is good and the subject is easily identifiable.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-1",
    matchedCellSubject: "Apple",
    confidenceThreshold: 0.7,
  },
};

export const NoMatch: Story = {
  args: {
    confidence: 0.45,
    critique:
      "The image shows a banana, but there is no 'banana' cell available in the current bingo board. While the image quality is good and the subject is clear, it doesn't match any of the available subjects.",
    acceptanceStatus: "no_match",
    matchedCellId: null,
    matchedCellSubject: null,
    confidenceThreshold: 0.7,
  },
};

export const InappropriateContent: Story = {
  args: {
    confidence: 0.0,
    critique:
      "The image contains content that is not appropriate for all ages. Please upload a different image that follows the game guidelines.",
    acceptanceStatus: "inappropriate_content",
    matchedCellId: null,
    matchedCellSubject: null,
    confidenceThreshold: 0.7,
  },
};

export const LowConfidence: Story = {
  args: {
    confidence: 0.35,
    critique:
      "The image appears to show something that might be related to 'car', but the image is blurry and the subject is not clearly visible. The confidence level is below the required threshold.",
    acceptanceStatus: "no_match",
    matchedCellId: "cell-5",
    matchedCellSubject: "Car",
    confidenceThreshold: 0.7,
  },
};

export const HighConfidenceAccepted: Story = {
  args: {
    confidence: 0.95,
    critique:
      "Excellent match! The image shows a beautiful golden retriever dog in a park setting. The dog is clearly the main subject and perfectly matches the 'dog' cell. High confidence in this match.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-3",
    matchedCellSubject: "Dog",
    confidenceThreshold: 0.7,
  },
};

export const EdgeCaseAccepted: Story = {
  args: {
    confidence: 0.71,
    critique:
      "The image shows a cat sleeping on a couch. While the lighting is somewhat dim, the cat is clearly visible and identifiable. This meets the minimum confidence threshold for acceptance.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-7",
    matchedCellSubject: "Cat",
    confidenceThreshold: 0.7,
  },
};

export const LongCritique: Story = {
  args: {
    confidence: 0.82,
    critique:
      "This is a very detailed analysis of the submitted image. The photograph shows a modern smartphone placed on a white desk surface. The device appears to be an iPhone with a black case, and the screen is clearly visible showing the home screen with various app icons. The image quality is excellent with good lighting and sharp focus. The smartphone is positioned at a slight angle, making it easy to identify as a mobile phone device. This clearly matches the 'smartphone' cell in the bingo board with high confidence. The background is clean and uncluttered, which helps emphasize the main subject. Overall, this is an excellent submission that clearly demonstrates the requested subject matter.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-12",
    matchedCellSubject: "Smartphone",
    confidenceThreshold: 0.6,
  },
};

export const WithCustomClassName: Story = {
  args: {
    confidence: 0.78,
    critique:
      "The image shows a beautiful sunset over the ocean with vibrant orange and pink colors in the sky.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-9",
    matchedCellSubject: "Sunset",
    confidenceThreshold: 0.5,
    className: "max-w-md",
  },
};
