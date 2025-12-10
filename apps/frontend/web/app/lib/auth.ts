import { createAuthClient } from "better-auth/react";
import { getConfig } from "#lib/config";
import type { Auth } from "@yourcompany/api/auth";
import { customSessionClient } from "better-auth/client/plugins";

const config = getConfig();

export const authClient = createAuthClient({
  baseURL: config.authUrl,
  socialProviders: {},
  plugins: [customSessionClient<Auth>()],
});

export const {
  useSession: useBetterAuthSession,
  signIn,
  signUp,
  signOut,
  resetPassword,
  changeEmail,
  changePassword,
} = authClient;

export const authFetch = authClient.$fetch;

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthUser = typeof authClient.$Infer.Session.user;
