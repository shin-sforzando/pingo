import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { type Subject, SubjectList } from "./SubjectList";

const meta = {
  title: "Game/SubjectList",
  component: SubjectList,
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
} satisfies Meta<typeof SubjectList>;

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
    "Olive branch",
    "Maroon coat",
    "Navy blue shirt",
    "Coral reef",
    "Emerald stone",
    "Ruby necklace",
  ];

  for (let i = 0; i < count; i++) {
    subjects.push({
      id: `subject-${i}`,
      text: sampleTexts[i % sampleTexts.length],
    });
  }

  return subjects;
};

const renderWithState = (args: React.ComponentProps<typeof SubjectList>) => {
  const [subjects, setSubjects] = useState<Subject[]>(
    args.subjects || generateSampleSubjects(10),
  );
  return (
    <SubjectList
      {...args}
      subjects={subjects}
      onSubjectsChange={(newSubjects) => {
        console.log("Subjects changed:", newSubjects);
        setSubjects(newSubjects);
      }}
    />
  );
};

// All stories with interactive state
export const Default: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    subjects: generateSampleSubjects(30),
    onSubjectsChange: (_newSubjects) => {},
  },
};

// With exactly 24 subjects (all adopted)
export const ExactlyMaxAdopted: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    subjects: generateSampleSubjects(24),
    onSubjectsChange: (_newSubjects) => {},
  },
};

// With empty subjects
export const EmptyList: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    subjects: [],
    onSubjectsChange: (_newSubjects) => {},
  },
};

// With custom styling
export const WithCustomStyling: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    subjects: generateSampleSubjects(10),
    className: "bg-muted p-4 rounded-xl",
    onSubjectsChange: (_newSubjects) => {},
  },
};
