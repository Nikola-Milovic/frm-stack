import { useState } from "react";
import { cn } from "#lib/utils";

interface EmailInputProps {
  onSubmit: (email: string) => void;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

export function EmailInput({ onSubmit, isLoading, placeholder = "your@email.com", className }: EmailInputProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit(email);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full h-12 px-4 pr-20 text-base border border-gray-200 rounded-lg",
            "bg-white shadow-sm transition-all outline-none",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
            "placeholder:text-gray-400",
          )}
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className={cn(
            "absolute right-2 top-1/2 cursor-pointer -translate-y-1/2",
            "px-3 py-1.5 text-sm font-medium text-blue-600",
            "hover:text-blue-700 disabled:text-gray-400",
            "transition-colors duration-200",
            "disabled:cursor-not-allowed",
          )}
        >
          {isLoading ? "..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
