import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "#providers/session-provider.tsx";
import type { AuthSession } from "#lib/auth.ts";

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value = {
    session,
    isLoading: isPending,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
