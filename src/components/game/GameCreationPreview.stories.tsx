import { fakerJA as faker } from "@faker-js/faker";
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
  const sampleTexts = faker.helpers.multiple(() => faker.lorem.word(), {
    count: 24,
  });

  for (let i = 0; i < count; i++) {
    subjects.push({
      id: `subject-${i}`,
      text: sampleTexts[i % sampleTexts.length],
    });
  }

  return subjects;
};

const renderWithState = (
  args: React.ComponentProps<typeof GameCreationPreview>,
) => {
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
};

// Interactive story with state
export const Default: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    initialSubjects: generateSampleSubjects(30),
  },
};

// With empty subjects
export const EmptyBoard: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    initialSubjects: [],
  },
};

// With custom styling
export const WithCustomStyling: Story = {
  render: renderWithState,
  args: {
    maxAdopted: 24,
    initialSubjects: generateSampleSubjects(10),
    className: "bg-muted p-4 rounded-xl",
  },
};
