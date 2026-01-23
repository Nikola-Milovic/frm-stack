---
name: mobile-auth
description: Better Auth integration with Expo/React Native. Use when working on mobile authentication, session management, or debugging auth issues in the mobile app. Triggers on "mobile auth", "expo auth", "better-auth expo", "session provider", "SecureStore", or when editing apps/frontend/mobile auth files.
---

# Mobile Auth (Better Auth + Expo)

The mobile app uses Better Auth with `@better-auth/expo` plugin.

## The Problem

Better Auth's session state doesn't sync reliably with React context on Expo. The plugin stores cookies in `expo-secure-store`, but reactive session updates don't propagate as expected.

## Our Solution

Custom `SessionProvider` that:
1. **Initializes from cache** - Read cached session from SecureStore on app start
2. **Subscribes to auth signals** - Listen to `$sessionSignal` for auth state changes
3. **Manual refresh** - Call `onAuthSuccess()` after sign-in/sign-up

### Reading Cached Session

```tsx
// src/lib/auth.ts
export function getCachedSession(): AuthSession | null {
  const raw = SecureStore.getItem(SESSION_DATA_KEY);
  // validate and return
}
```

### Session Provider

```tsx
// src/providers/session-provider.tsx
useEffect(() => {
  const store = getAuthClient().$store;
  const sessionSignal = store.atoms.$sessionSignal;
  const unsubscribe = sessionSignal.subscribe(() => {
    setData(getCachedSession());
  });
  return () => unsubscribe();
}, []);
```

## Required Configuration

| Config | Value | Notes |
|--------|-------|-------|
| `cookiePrefix` | `yourcompany` | Must match backend's `advanced.cookiePrefix` |
| `scheme` | `mobile` | Must match `scheme` in `app.json` |
| `storagePrefix` | `mobile` | Prefix for device storage keys |

## Key Files

- Mobile auth client: `apps/frontend/mobile/src/lib/auth.ts`
- Session provider: `apps/frontend/mobile/src/providers/session-provider.tsx`
- Backend auth config: `apps/backend/api/src/auth.ts`

## Known Issues

- Session expiry detection relies on parsing `expiresAt` from cached data
- `$sessionSignal` subscription is undocumented API and may change
- Web platform falls back to standard cookie-based auth (no SecureStore)

## Troubleshooting

| Issue | Check |
|-------|-------|
| Session not updating | Verify `onAuthSuccess()` called after sign-in |
| Cookie mismatch | Compare `cookiePrefix` between mobile and backend |
| Auth redirect fails | Check `scheme` matches `app.json` |
