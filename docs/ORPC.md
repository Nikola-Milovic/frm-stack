# oRPC

## Purpose

Type-safe RPC between `apps/frontend/web` and `apps/backend/api`, with React Query helpers on the client.

## Where it lives

- Server router root: `apps/backend/api/src/routers/index.ts`
- Server oRPC setup: `apps/backend/api/src/orpc.ts`
- Client provider/utilities: `apps/frontend/web/app/providers/orpc-provider.tsx` and `apps/frontend/web/app/lib/api.ts`

## How it works (this repo)

### Server

- All RPC requests hit `POST/GET /rpc/*` and are handled by `RPCHandler` in `apps/backend/api/src/orpc.ts`.
- The oRPC context includes:
  - `user` and `session` (from Better Auth middleware)
  - request headers + client metadata (IP / user-agent)
- Errors are declared centrally in `apps/backend/api/src/orpc.ts` (`UNAUTHORIZED`, `BAD_REQUEST`, etc.).

### Router pattern

- Each “domain” exports a router factory, e.g. `userRouter()` and `todoRouter()`.
- The root router composes them:

```ts
// apps/backend/api/src/routers/index.ts
orpc.router({
  user: userRouter(),
  todo: todoRouter(),
});
```

### Auth middleware

- For protected procedures, this repo uses `authOnly` (`apps/backend/api/src/middleware.ts`).
- Pattern:
  - `orpc.use(authOnly).input(zodSchema).handler(...)`

## Client usage (React Query)

### Queries

```ts
const api = useApi();
const todosQuery = useQuery(api.todo.list.queryOptions({ input: { completed: false } }));
```

### Mutations

```ts
const api = useApi();
const createTodo = useMutation(api.todo.create.mutationOptions({ onSuccess: () => queryClient.invalidateQueries({ queryKey: api.todo.key() }) }));
createTodo.mutate({ title: "Hello" });
```

## Conventions

- Keep HTTP routes (like `/health`) as plain Hono routes.
- Keep “business logic” in services; routers should mostly:
  - validate inputs (Zod)
  - enforce auth middleware
  - map errors to oRPC errors + log

## Gotchas

- When using NodeNext/ESM, be careful with import resolution. Prefer stable module exports or explicit extensions where required by config.
