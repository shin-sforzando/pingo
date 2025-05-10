import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import { RegisterForm } from "./RegisterForm";

const meta = {
  title: "Auth/RegisterForm",
  component: RegisterForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSuccess: () => console.log("Registration successful"),
    onError: (error) => console.error("Registration error:", error),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get inputs by test ID
    const usernameInput = canvas.getByTestId("username-input");
    const passwordInput = canvas.getByTestId("password-input");
    const confirmPasswordInput = canvas.getByTestId("confirm-password-input");
    const registerButton = canvas.getByTestId("submit-button");

    // Fill in the username field
    await expect(usernameInput).toBeInTheDocument();
    await userEvent.type(usernameInput, "John Doe", { delay: 100 });

    // Fill in the password field
    await expect(passwordInput).toBeInTheDocument();
    await userEvent.type(passwordInput, "Password123", { delay: 100 });

    // Fill in the confirm password field
    await expect(confirmPasswordInput).toBeInTheDocument();
    await userEvent.type(confirmPasswordInput, "Password123", { delay: 100 });

    // Click the register button
    await expect(registerButton).toBeInTheDocument();
    await userEvent.click(registerButton);
  },
};
