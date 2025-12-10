import type { StorybookConfig } from "@storybook/react-vite";

import { createStorybookMain } from "@yourcompany/testing/storybook/main";

const config = createStorybookMain({
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
}) satisfies StorybookConfig;

export default config;

