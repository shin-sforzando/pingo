import type { Meta, StoryObj } from "@storybook/nextjs";
import { TermsPageContent } from "./content";

const meta = {
  title: "Pages/Terms",
  component: TermsPageContent,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Terms of Service page with both Japanese and English versions on a single page.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TermsPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view - Terms of Service page with Japanese version at top and English version below
 *
 * Features:
 * - Japanese terms of service (legal document)
 * - Clear divider between languages
 * - English terms of service below
 * - Responsive layout for mobile and desktop
 * - Semantic HTML with lang attributes
 */
export const Default: Story = {};
