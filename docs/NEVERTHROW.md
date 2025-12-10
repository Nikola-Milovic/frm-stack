# neverthrow

## Purpose

Use `Result<T, E>` for explicit success/error flow (instead of throwing everywhere), especially in service methods.

## Where it lives

- Service examples: `apps/backend/api/src/services/user.ts`, `apps/backend/api/src/services/todo.ts`
- Helpers: `packages/backend/core/src/validation.ts` (`validateInput`, `typedError`)

## Core pattern

### Validate input early

```ts
const validated = validateInput(schema, input);
if (validated.isErr()) return err(validated.error);
```

### Wrap “throwy” code once

Use `fromAsyncThrowable` to convert thrown exceptions into a typed `Result`.

```ts
return await fromAsyncThrowable(
  async () => {
    // DB calls, etc.
    return value;
  },
  (e) => typedError(e),
)();
```

## Conventions (recommended)

- Services return `Promise<Result<… , Error>>`.
- Routers translate domain errors to transport errors:
  - auth/ownership → 401/403
  - missing resources → 404
  - validation/update conflicts → 400
  - unexpected → 500 (log with context)

## Gotchas

- Don’t “double wrap”: if a service already returns a `Result`, keep router logic simple (check `isErr()` once).
- Avoid logging PII/secrets inside errors; log structured context instead (ids, not tokens).
