import type { AuthSession } from "#lib/auth.ts";
import { useBetterAuthSession } from "#lib/auth.ts";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useIsMounted } from "@yourcompany/web/hooks/is-mounted";

type SessionContextType = {
  isPending: boolean;
  data: AuthSession | null;
};

const SessionContext = createContext<SessionContextType | null>(null);

const SESSION_STORAGE_KEY = "yourcompany_session_data";

// Helper functions for localStorage
const getStoredSession = (): AuthSession | null => {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredSession = (session: AuthSession | null) => {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
};

export function SessionProvider({ children }: { children: ReactNode }) {
  // Initialize with stored session to prevent flicker
  const storedSession = typeof window !== "undefined" ? getStoredSession() : null;
  const [isPending, setIsPending] = useState(!storedSession); // If we have stored session, start as not pending
  const [data, setData] = useState<AuthSession | null>(storedSession);
  const isMounted = useIsMounted();

  const onUpdate = useCallback((pending: boolean, nextData: AuthSession | null) => {
    setIsPending(pending);
    // Only update data when not pending (loading is complete)
    // This preserves existing session data while new session checks are in progress
    if (!pending) {
      setData(nextData);
      // Persist session to localStorage for navigation persistence
      setStoredSession(nextData);
    }
  }, []);

  return (
    <SessionContext.Provider value={{ isPending, data }}>
      {children}
      {isMounted && <SessionBridge onUpdate={onUpdate} />}
    </SessionContext.Provider>
  );
}

function SessionBridge({ onUpdate }: { onUpdate: (isPending: boolean, data: AuthSession | null) => void }) {
  const { isPending: betterAuthIsPending, data: betterAuthData } = useBetterAuthSession();

  useEffect(() => {
    onUpdate(betterAuthIsPending, betterAuthData ?? null);
  }, [betterAuthIsPending, betterAuthData, onUpdate]);

  return null;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a SessionProvider");
  return context;
}
