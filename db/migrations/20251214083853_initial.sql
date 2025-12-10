-- Create "users" table
CREATE TABLE "public"."users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "email" text NOT NULL, "email_verified" boolean NOT NULL, "created_at" timestamp NOT NULL, "updated_at" timestamp NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "users_email_unique" UNIQUE ("email"));
-- Create "verifications" table
CREATE TABLE "public"."verifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "identifier" text NOT NULL, "value" text NOT NULL, "expires_at" timestamp NOT NULL, "created_at" timestamp NULL, "updated_at" timestamp NULL, PRIMARY KEY ("id"));
-- Create "accounts" table
CREATE TABLE "public"."accounts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "account_id" uuid NOT NULL, "provider_id" text NOT NULL, "user_id" uuid NOT NULL, "access_token" text NULL, "refresh_token" text NULL, "id_token" text NULL, "access_token_expires_at" timestamp NULL, "refresh_token_expires_at" timestamp NULL, "scope" text NULL, "password" text NULL, "created_at" timestamp NOT NULL, "updated_at" timestamp NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "sessions" table
CREATE TABLE "public"."sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "expires_at" timestamp NOT NULL, "token" text NOT NULL, "created_at" timestamp NOT NULL, "updated_at" timestamp NOT NULL, "ip_address" text NULL, "user_agent" text NULL, "user_id" uuid NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "sessions_token_unique" UNIQUE ("token"), CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "todos" table
CREATE TABLE "public"."todos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "title" text NOT NULL, "completed" boolean NOT NULL DEFAULT false, "created_at" timestamp NOT NULL, "updated_at" timestamp NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "todos_user_id_completed_idx" to table: "todos"
CREATE INDEX "todos_user_id_completed_idx" ON "public"."todos" ("user_id", "completed");
-- Create index "todos_user_id_idx" to table: "todos"
CREATE INDEX "todos_user_id_idx" ON "public"."todos" ("user_id");
