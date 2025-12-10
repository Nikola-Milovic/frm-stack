import type { StorybookConfig } from "@storybook/react-vite";

import { createStorybookMain } from "@yourcompany/testing/storybook/main";

const config = createStorybookMain({
  stories: ["../app/**/*.mdx", "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../public"],
}) satisfies StorybookConfig;

export default config;

