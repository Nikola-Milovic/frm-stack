/**
 * Shared Storybook (React + Vite) config.
 *
 * Consumers are expected to override at least `stories` to match their layout.
 * (e.g. `../src/**` for packages, `../app/**` for apps)
 */

import type { StorybookConfig } from "@storybook/react-vite";

export const defaultStories = [
  "../src/**/*.mdx",
  "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  "../app/**/*.mdx",
  "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
];

export const baseMain = {
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  addons: ["@storybook/addon-links", "@storybook/addon-a11y", "@storybook/addon-docs", "@storybook/addon-themes"],
  docs: { defaultName: "Docs" },
  stories: defaultStories,
  async viteFinal(config) {
    const [{ mergeConfig }, tailwindModule] = await Promise.all([
      import("vite"),
      import("@tailwindcss/vite").catch(() => null),
    ]);

    const tailwindcss = tailwindModule?.default;
    if (!tailwindcss) return config;

    return mergeConfig(config, {
      plugins: [tailwindcss()],
    });
  },
} satisfies StorybookConfig;

/**
 * @param overrides
 */
export function createStorybookMain(overrides: Partial<StorybookConfig> = {}): StorybookConfig {
  return {
    ...baseMain,
    ...overrides,
    stories: overrides.stories ?? defaultStories,
  };
}

export default baseMain;
