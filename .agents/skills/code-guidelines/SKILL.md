---
name: code-guidelines
description: Apply this repository's coding conventions and patterns. Use when writing or reviewing code in this codebase to ensure consistency with established patterns for DI, logging, error handling, testing, and documentation. Auto-trigger when implementing features, fixing bugs, or reviewing code changes.
---

# Code Guidelines

This repo is a **demo**. Patterns here are suggestions; swap for what fits your team.

## Dependency Injection

Prefer constructor/function injection for side effects:

```typescript
// Good: injectable
function createUserService(db: Database, logger: Logger) {
  return { ... }
}

// Bad: global import
import { db } from '../db'
```

- Wire at edges (app startup, router factories)
- Avoid global singleton imports from deep modules
- Tests supply fakes without patching globals

## Error Handling (neverthrow)

Use `Result<T, E>` for explicit success/error flow.

```typescript
// Services return Result
function findUser(id: string): ResultAsync<User, NotFoundError | DbError>

// Validate input early
const validated = validateInput(schema, input);
if (validated.isErr()) return err(validated.error);

// Wrap throwy code once
return await fromAsyncThrowable(
  async () => dbCall(),
  (e) => typedError(e),
)();
```

**Error mapping:**
- auth/ownership → 401/403
- missing resources → 404
- validation → 400
- unexpected → 500 (log with context)

**Helpers:** `packages/backend/core/src/validation.ts` (`validateInput`, `typedError`)

## Logging (pino)

Use structured logging:

```typescript
logger.info("user created", { userId: user.id, email: user.email })
logger.error("operation failed", err, { orderId, userId })
```

**Rules:**
- Log at boundaries (request → router → service)
- Never log secrets (tokens, passwords, cookies)
- Use levels: error, warn, info, debug
- Optional `REQUEST_LOGGING` flag in `apps/backend/api/src/orpc.ts`

**Location:** `apps/backend/api/src/log.ts`, `packages/backend/core/src/log.ts`

## oRPC (Type-safe RPC)

Type-safe RPC between frontend and backend with React Query helpers.

### Server Pattern

```typescript
// Router factory pattern
orpc.router({
  user: userRouter(),
  todo: todoRouter(),
});

// Protected procedure with authOnly middleware
orpc.use(authOnly).input(zodSchema).handler(...)
```

### Client Usage

```typescript
const api = useApi();

// Queries
const todosQuery = useQuery(api.todo.list.queryOptions({ input: { completed: false } }));

// Mutations
const createTodo = useMutation(api.todo.create.mutationOptions({
  onSuccess: () => queryClient.invalidateQueries({ queryKey: api.todo.key() })
}));
```

**Key files:**
- Server router: `apps/backend/api/src/routers/index.ts`
- Server setup: `apps/backend/api/src/orpc.ts`
- Client: `apps/frontend/web/app/providers/orpc-provider.tsx`

## Auth (Better Auth)

Cookie-based auth with typed user/session in oRPC context.

```typescript
// Read user in oRPC handlers
const userId = context.user.id;

// Use authOnly middleware for protected procedures
orpc.use(authOnly).handler(...)
```

**CORS requirements:**
- Backend: `hono/cors` with `credentials: true`
- Frontend: fetch with `credentials: "include"`

**Key files:**
- Backend: `apps/backend/api/src/auth.ts`
- Core: `packages/backend/core/src/auth.ts`
- Frontend: `apps/frontend/web/app/providers/*`

## Config (env + Zod)

Validate env vars at startup with Zod:

```typescript
// Backend: parse process.env at module load
const appConfig = configSchema.parse(process.env);

// Frontend: read import.meta.env
const config = getConfig();
```

**Vite env file priority:**
1. `.env.[mode].local` (git-ignored)
2. `.env.[mode]`
3. `.env.local` (git-ignored)
4. `.env`

Only `VITE_*` variables exposed to client. Keep `.env.*.example` in sync.

## CI/CD

**Local (Husky):** On `git push`:
- `pnpm lint:check`
- `pnpm format:check`
- `pnpm typecheck`

Bypass: `HUSKY=0 git push`

**GitHub Actions:** On PR:
- All above + `pnpm test`

Workflow: `.github/workflows/ci.yml`

## Tech Choices Summary

| Layer | Choice | Why |
|-------|--------|-----|
| DB | Kysely | Typed query builder, SQL-first, easy DI |
| RPC | oRPC | End-to-end typed, React Query helpers |
| Router | TanStack Router | Type-safe, file-based |
| Errors | neverthrow | Explicit success/failure flows |
| Auth | Better Auth | Free, good coverage, easy swap |
| Testing | testcontainers | Real Postgres, shared container for speed |

## When Writing Code

1. Check existing patterns in similar files
2. Use DI for testability
3. Handle errors explicitly with Result types
4. Add structured logging at boundaries
5. Write tests that use DI
6. Run `pnpm typecheck` and `pnpm test`
