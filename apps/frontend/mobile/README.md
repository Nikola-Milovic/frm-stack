# Mobile App (Expo)

React Native mobile client built with [Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing.

## Getting Started

```bash
pnpm install
pnpm dev:mobile  # or: npx expo start
```

## Authentication

We use [Better Auth](https://www.better-auth.com/) with the `@better-auth/expo` client plugin. However, **Better Auth and Expo don't play along perfectly out of the box** — the session management required some custom handling to work reliably on mobile.

Key files:
- `src/lib/auth.ts` — Auth client initialization with Expo-specific config
- `src/providers/session-provider.tsx` — Custom session state management

> ⚠️ **WIP**: The session sync between Better Auth's internal state and our React context is still being refined. See `docs/mobile.md` for details.

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Better Auth Expo Plugin](https://www.better-auth.com/docs/integrations/expo)
