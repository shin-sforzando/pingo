import type { Meta, StoryObj } from "@storybook/react";
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
    onSubjectChange: { action: "subject changed" },
    onDelete: { action: "deleted" },
  },
} satisfies Meta<typeof SubjectItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic states with interactive editing
export const Default: Story = {
  render: function Render(args) {
    const [subject, setSubject] = useState(args.subject || "Red car");

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
  },
  args: {
    subject: "Red car",
    isAdopted: false,
    index: 0,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

export const Adopted: Story = {
  render: function Render(args) {
    const [subject, setSubject] = useState(args.subject || "Red car");

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
  },
  args: {
    subject: "Red car",
    isAdopted: true,
    index: 0,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

export const WithLongText: Story = {
  render: function Render(args) {
    const [subject, setSubject] = useState(
      args.subject ||
        "A very long subject that might need to be truncated or wrapped in some way",
    );

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
  },
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
  render: function Render(args) {
    const [subject, setSubject] = useState(args.subject || "");

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
  },
  args: {
    subject: "",
    isAdopted: false,
    index: 10,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

export const Dragging: Story = {
  render: function Render(args) {
    const [subject, setSubject] = useState(args.subject || "Red car");

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
  },
  args: {
    subject: "Red car",
    isAdopted: true,
    index: 0,
    isDragging: true,
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

// Different indices
export const WithHighIndex: Story = {
  render: function Render(args) {
    const [subject, setSubject] = useState(args.subject || "Red car");

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
  },
  args: {
    subject: "Red car",
    isAdopted: true,
    index: 23, // Last index in a 5x5 bingo board (excluding center)
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};

// With custom styling
export const WithCustomStyling: Story = {
  render: function Render(args) {
    const [subject, setSubject] = useState(args.subject || "Red car");

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
  },
  args: {
    subject: "Red car",
    isAdopted: true,
    index: 0,
    className: "bg-accent text-accent-foreground",
    onSubjectChange: () => {},
    onDelete: () => {},
  },
};
