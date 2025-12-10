import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { Router } from "@yourcompany/api/orpc";

export type APIOutputs = InferRouterOutputs<Router>;
export type APIInputs = InferRouterInputs<Router>;
