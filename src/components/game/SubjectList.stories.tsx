import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs";
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
const generateSampleSubjects = (
  count: number,
  withErrors = false,
): Subject[] => {
  const subjects: Subject[] = [];
  const sampleTexts = faker.helpers.multiple(() => faker.lorem.word(), {
    count: count,
  });

  // Sample error messages
  const sampleErrors = [
    "This subject is too abstract to photograph",
    "This subject is too vague",
    "This subject is similar to another one",
    "This subject may not be appropriate for all ages",
    "This subject is too common",
  ];

  for (let i = 0; i < count; i++) {
    const subject: Subject = {
      id: `subject-${i}`,
      text: sampleTexts[i % sampleTexts.length],
    };

    // Add errors to some subjects if requested
    if (withErrors && i % 3 === 0) {
      subject.error = sampleErrors[i % sampleErrors.length];
    }

    subjects.push(subject);
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

// With validation errors
export const WithValidationErrors: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    subjects: generateSampleSubjects(15, true),
    onSubjectsChange: (_newSubjects) => {},
  },
};
