import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./input";

export default {
  title: "Web/Base/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Base text input used across the design system. Supports all native `<input>` props and includes default Tailwind styling, focus rings, and invalid/disabled states.",
      },
    },
  },
  args: {
    type: "text",
    placeholder: "Type something…",
  },
} satisfies Meta<typeof Input>;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "hello@example.com",
  },
  parameters: {
    docs: {
      description: {
        story: "Renders with an initial value via `defaultValue`.",
      },
    },
  },
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "not-an-email",
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates invalid styling via `aria-invalid`.",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Disabled",
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates disabled styling via the `disabled` prop.",
      },
    },
  },
};
