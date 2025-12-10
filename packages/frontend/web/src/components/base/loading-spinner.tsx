import { cn } from "#lib/utils";
import { LoaderIcon } from "lucide-react";

export function LoadingSpinner({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <LoaderIcon
      className={cn("animate-spin", size === "sm" && "w-4 h-4", size === "md" && "w-6 h-6", size === "lg" && "w-8 h-8")}
    />
  );
}
