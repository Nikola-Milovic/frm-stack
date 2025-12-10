# CI/CD

This repo uses:

- **Husky** (local git hooks) to run fast checks before pushing.
- **GitHub Actions** (CI) to enforce checks on pull requests.

## Local (Husky)

On `git push`, the `pre-push` hook runs:

- `pnpm lint:check`
- `pnpm format:check`
- `pnpm typecheck`

If you need to bypass hooks temporarily:

```bash
HUSKY=0 git push
```

## CI (GitHub Actions)

On every Pull Request, the CI workflow runs:

- `pnpm lint:check`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`

Workflow definition: `.github/workflows/ci.yml`.
