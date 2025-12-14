set dotenv-load := true
set shell := ["bash", "-cu"]

export DOCKER_BUILDKIT := "1"
export COMPOSE_DOCKER_CLI_BUILD := "1"
export UID := `id -u`
export GID := `id -g`

dc := "docker compose"

# Display help information
help:
	@just --list

# Dev docker compose exposed for commands
d +COMMANDS:
	@{{dc}} {{COMMANDS}}

db-migrate:
	@atlas schema apply --url "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable" --to "file://db/schema.sql" --dev-url "docker://postgres/17" --auto-approve

# Versioned migrations (Atlas)
#
# Workflow:
# - Keep `db/schema.sql` as source of truth
# - Use `db-migration-new <name>` to generate a migration from schema diff
# - Use `db-migration-apply` to apply versioned migrations
db-migration-new NAME:
	@mkdir -p db/migrations
	@atlas migrate diff {{NAME}} --to "file://db/schema.sql" --dev-url "docker://postgres/17" --dir "file://db/migrations"

db-migration-apply:
	@atlas migrate apply --url "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable" --dir "file://db/migrations"

db-migration-status:
	@atlas migrate status --url "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable" --dir "file://db/migrations"

db-migration-hash:
	@atlas migrate hash --dir "file://db/migrations"

db-psql:
	@{{dc}} exec -it postgres psql -U postgres -h localhost -d postgres

# Generate TypeScript types from deployed database schema
# Connects to PostgreSQL, introspects current schema, converts to TypeScript
# Run after any schema changes.
db-schema:
	@pnpm kysely-codegen --camel-case --out-file ./packages/backend/core/src/schema.ts --url postgres://postgres:postgres@localhost:5432?sslmode=disable
	@pnpm biome format --fix packages/backend/core/src/schema.ts

setup: dev-clean
	@pnpm install
	@./tools/dev_check.sh
	@{{dc}} up -d
	@POSTGRES_CONTAINER_NAME=$(docker inspect -f '{{{{.Name}}' $(docker-compose ps -q postgres) | cut -c2-) ./tools/db_isready.sh
	@just db-migrate

start:
	@just d up -d
	@pnpm dev

db-seed:
	@find db/seed -type f -name "*.sql" -exec sh -c 'cat {} | {{dc}} exec -T postgres psql -U postgres -h localhost -d postgres' \;

dev-clean:
	@{{dc}} down -v --remove-orphans
