import type { Meta, StoryObj } from "@storybook/react";

import { SignIn } from "./signin";

export default {
  title: "App/Auth/SignIn",
  component: SignIn,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Sign-in form used on the Auth page. This story focuses on layout/styling; the submit button stays disabled until email + password are provided.",
      },
    },
  },
  render: (args) => (
    <div className="w-full max-w-sm">
      <SignIn {...args} />
    </div>
  ),
} satisfies Meta<typeof SignIn>;

type Story = StoryObj<typeof SignIn>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: {
    onSuccess: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders the component in isolation. To exercise real auth flows, ensure `VITE_AUTH_URL` is configured and run against a backend.",
      },
    },
  },
};
