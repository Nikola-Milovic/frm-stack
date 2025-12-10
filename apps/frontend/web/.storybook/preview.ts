import type { Preview } from "@storybook/react";

import basePreview from "@yourcompany/testing/storybook/preview";

import "../app/main.css";

export default { ...basePreview } satisfies Preview;
