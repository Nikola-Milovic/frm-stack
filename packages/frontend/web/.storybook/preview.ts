import type { Preview } from "@storybook/react";

import basePreview from "@yourcompany/testing/storybook/preview";

import "../src/index.css";

export default { ...basePreview } satisfies Preview;
