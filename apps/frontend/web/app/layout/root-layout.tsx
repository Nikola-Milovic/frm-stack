import { AuthProvider } from "#providers/auth-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@yourcompany/web/components/base/sonner";
import { Outlet } from "react-router";
import { ORPCProvider } from "#providers/orpc-provider";
import { AuthGuard } from "#components/auth/auth-guard";
import { getConfig } from "#lib/config";
import { SessionProvider } from "#providers/session-provider";

export default function RootLayout() {
  const config = getConfig();
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider>
          <ORPCProvider apiUrl={config.apiUrl}>
            <AuthGuard>
              <Outlet />
              <Toaster position="bottom-center" />
            </AuthGuard>
          </ORPCProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
