# Mobile App

The mobile app is built with Expo and React Native, located in `apps/frontend/mobile/`.

## Authentication Challenges

Better Auth provides an `@better-auth/expo` client plugin, but integrating it smoothly with React Native has required some workarounds.

### The Problem

Better Auth's session state doesn't sync reliably with React context out of the box on Expo. The plugin stores auth cookies in `expo-secure-store`, but the reactive session updates don't propagate as expected to React components.

### Our Solution (WIP)

We've implemented a custom `SessionProvider` that:

1. **Initializes from cache** — On app start, we read the cached session from SecureStore to avoid a loading flash
2. **Subscribes to auth signals** — We listen to Better Auth's internal `$sessionSignal` to detect auth state changes
3. **Manual refresh** — After sign-in/sign-up, we explicitly call `onAuthSuccess()` to refresh the session

```tsx
// src/lib/auth.ts
export function getCachedSession(): AuthSession | null {
  // Read directly from SecureStore on native
  const raw = SecureStore.getItem(SESSION_DATA_KEY);
  // ... validate and return
}
```

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

### Configuration

The auth client requires matching configuration between mobile and backend:

| Config | Value | Notes |
|--------|-------|-------|
| `cookiePrefix` | `yourcompany` | Must match backend's `advanced.cookiePrefix` |
| `scheme` | `mobile` | Must match `scheme` in `app.json` |
| `storagePrefix` | `mobile` | Prefix for device storage keys |

### Known Issues

- Session expiry detection relies on parsing the `expiresAt` field from cached data
- The `$sessionSignal` subscription is an undocumented API and may change
- Web platform falls back to standard cookie-based auth (no SecureStore)

### Future Improvements

- Investigate if newer Better Auth versions improve Expo support
- Consider contributing fixes upstream
- Add proper token refresh handling

