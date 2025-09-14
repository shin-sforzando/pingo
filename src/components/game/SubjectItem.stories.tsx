import { fakerJA as faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { SubjectItem } from "./SubjectItem";

const meta = {
  title: "Game/SubjectItem",
  component: SubjectItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isAdopted: {
      control: "boolean",
      description:
        "Whether this subject is adopted (will be used in the bingo board)",
    },
    isDragging: {
      control: "boolean",
      description: "Whether the item is being dragged",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    onSubjectChange: { action: "subject changed" },
    onDelete: { action: "deleted" },
  },
} satisfies Meta<typeof SubjectItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const renderWithState = (args: React.ComponentProps<typeof SubjectItem>) => {
  const [subject, setSubject] = useState(args.subject);

  return (
    <SubjectItem
      {...args}
      subject={subject}
      onSubjectChange={(value, index) => {
        console.log(`Subject changed to: ${value} at index: ${index}`);
        setSubject(value);
      }}
      onDelete={(index) => console.log(`Delete subject at index: ${index}`)}
    />
  );
};

// Basic states with interactive editing
export const Default: Story = {
  render: renderWithState,
  args: {
    subject: faker.lorem.word({ length: { min: 5, max: 20 } }),
    isAdopted: false,
    index: 0,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

export const Adopted: Story = {
  render: renderWithState,
  args: {
    subject: faker.lorem.word({ length: { min: 5, max: 20 } }),
    isAdopted: true,
    index: 0,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

export const WithLongText: Story = {
  render: renderWithState,
  args: {
    subject:
      "A very long subject that might need to be truncated or wrapped in some way",
    isAdopted: true,
    index: 5,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  render: renderWithState,
  args: {
    subject: "",
    isAdopted: false,
    index: 10,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

export const Dragging: Story = {
  render: renderWithState,
  args: {
    subject: faker.lorem.word({ length: { min: 5, max: 20 } }),
    isAdopted: true,
    index: 0,
    isDragging: true,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

// Different indices
export const WithHighIndex: Story = {
  render: renderWithState,
  args: {
    subject: faker.lorem.word({ length: { min: 5, max: 20 } }),
    isAdopted: true,
    index: 23, // Last index in a 5x5 bingo board (excluding center)
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

// With custom styling
export const WithCustomStyling: Story = {
  render: renderWithState,
  args: {
    subject: faker.lorem.word({ length: { min: 5, max: 20 } }),
    isAdopted: true,
    index: 0,
    className: "bg-accent text-accent-foreground",
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

// With error
export const WithError: Story = {
  render: renderWithState,
  args: {
    subject: "Abstract concept",
    isAdopted: true,
    index: 0,
    error: "This subject is too abstract to photograph",
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

// With error and not adopted
export const WithErrorNotAdopted: Story = {
  render: renderWithState,
  args: {
    subject: "Inappropriate content",
    isAdopted: false,
    index: 25,
    error: "This subject contains inappropriate content",
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};
