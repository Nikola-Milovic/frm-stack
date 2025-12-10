import { ORPCContext, type ORPCReactUtils } from "#providers/orpc-provider";
import { use } from "react";

export function useApi(): ORPCReactUtils {
  const orpc = use(ORPCContext);
  if (!orpc) {
    throw new Error("ORPCContext is not set up properly");
  }
  return orpc;
}
