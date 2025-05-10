import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";

import { LoginForm } from "./LoginForm";

const meta = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSuccess: () => console.log("Login successful"),
    onError: (error) => console.error("Login error:", error),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get inputs by test ID
    const usernameInput = canvas.getByTestId("username-input");
    const passwordInput = canvas.getByTestId("password-input");
    const loginButton = canvas.getByTestId("submit-button");

    // Fill in the username field
    await expect(usernameInput).toBeInTheDocument();
    await userEvent.type(usernameInput, "John Doe", { delay: 100 });

    // Fill in the password field
    await expect(passwordInput).toBeInTheDocument();
    await userEvent.type(passwordInput, "Password123", { delay: 100 });

    // Click the login button
    await expect(loginButton).toBeInTheDocument();
    await userEvent.click(loginButton);
  },
};
