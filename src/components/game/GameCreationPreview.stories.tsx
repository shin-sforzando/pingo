import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { GameCreationPreview } from "./GameCreationPreview";
import type { Subject } from "./SubjectList";

const meta = {
  title: "Game/GameCreationPreview",
  component: GameCreationPreview,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    maxAdopted: {
      control: { type: "number", min: 1, max: 30 },
      description:
        "Maximum number of subjects to adopt (use in the bingo board)",
    },
    onSubjectsChange: { action: "subjects changed" },
  },
} satisfies Meta<typeof GameCreationPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate sample subjects
const generateSampleSubjects = (count: number): Subject[] => {
  const subjects: Subject[] = [];
  const sampleTexts = [
    "Red car",
    "Blue sky",
    "Green tree",
    "Yellow flower",
    "White cloud",
    "Black cat",
    "Brown dog",
    "Orange fruit",
    "Purple grape",
    "Pink flamingo",
    "Gray elephant",
    "Silver spoon",
    "Golden ring",
    "Bronze medal",
    "Copper penny",
    "Teal ocean",
    "Magenta sunset",
    "Cyan river",
    "Lime leaf",
    "Indigo night",
    "Violet flower",
    "Crimson rose",
    "Amber light",
    "Turquoise gem",
  ];

  for (let i = 0; i < count; i++) {
    subjects.push({
      id: `subject-${i}`,
      text: sampleTexts[i % sampleTexts.length],
    });
  }

  return subjects;
};

// Interactive story with state
export const Default: Story = {
  render: function Render(args) {
    const [subjects, setSubjects] = useState<Subject[]>(
      args.initialSubjects || generateSampleSubjects(10),
    );

    return (
      <GameCreationPreview
        {...args}
        initialSubjects={subjects}
        onSubjectsChange={(newSubjects) => {
          console.log("Subjects changed:", newSubjects);
          setSubjects(newSubjects);
        }}
      />
    );
  },
  args: {
    maxAdopted: 24,
    initialSubjects: generateSampleSubjects(10),
  },
};

// With exactly 24 subjects (all adopted)
export const FullBoard: Story = {
  render: function Render(args) {
    const [subjects, setSubjects] = useState<Subject[]>(
      args.initialSubjects || generateSampleSubjects(24),
    );

    return (
      <GameCreationPreview
        {...args}
        initialSubjects={subjects}
        onSubjectsChange={(newSubjects) => {
          console.log("Subjects changed:", newSubjects);
          setSubjects(newSubjects);
        }}
      />
    );
  },
  args: {
    maxAdopted: 24,
    initialSubjects: generateSampleSubjects(24),
  },
};

// With empty subjects
export const EmptyBoard: Story = {
  render: function Render(args) {
    const [subjects, setSubjects] = useState<Subject[]>(
      args.initialSubjects || [],
    );

    return (
      <GameCreationPreview
        {...args}
        initialSubjects={subjects}
        onSubjectsChange={(newSubjects) => {
          console.log("Subjects changed:", newSubjects);
          setSubjects(newSubjects);
        }}
      />
    );
  },
  args: {
    maxAdopted: 24,
    initialSubjects: [],
  },
};

// With custom styling
export const WithCustomStyling: Story = {
  render: function Render(args) {
    const [subjects, setSubjects] = useState<Subject[]>(
      args.initialSubjects || generateSampleSubjects(10),
    );

    return (
      <GameCreationPreview
        {...args}
        initialSubjects={subjects}
        onSubjectsChange={(newSubjects) => {
          console.log("Subjects changed:", newSubjects);
          setSubjects(newSubjects);
        }}
      />
    );
  },
  args: {
    maxAdopted: 24,
    initialSubjects: generateSampleSubjects(10),
    className: "bg-muted p-4 rounded-xl",
  },
};

// Responsive display
export const Responsive: Story = {
  render: function Render(args) {
    const [subjects, setSubjects] = useState<Subject[]>(
      args.initialSubjects || generateSampleSubjects(10),
    );

    return (
      <GameCreationPreview
        {...args}
        initialSubjects={subjects}
        onSubjectsChange={(newSubjects) => {
          console.log("Subjects changed:", newSubjects);
          setSubjects(newSubjects);
        }}
      />
    );
  },
  args: {
    maxAdopted: 24,
    initialSubjects: generateSampleSubjects(10),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
