CREATE TABLE users (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	name text NOT NULL,
	email text NOT NULL,
	email_verified boolean NOT NULL,
  created_at timestamp NOT NULL,
	updated_at timestamp NOT NULL,
	CONSTRAINT users_email_unique UNIQUE(email)
);

CREATE TABLE accounts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	account_id uuid NOT NULL,
	provider_id text NOT NULL,
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	access_token text,
	refresh_token text,
	id_token text,
	access_token_expires_at timestamp,
	refresh_token_expires_at timestamp,
	scope text,
	password text,
	created_at timestamp NOT NULL,
	updated_at timestamp NOT NULL
);

CREATE TABLE sessions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	expires_at timestamp NOT NULL,
	token text NOT NULL,
	created_at timestamp NOT NULL,
	updated_at timestamp NOT NULL,
	ip_address text,
	user_agent text,
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT sessions_token_unique UNIQUE(token)
);

CREATE TABLE verifications (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	identifier text NOT NULL,
	value text NOT NULL,
	expires_at timestamp NOT NULL,
	created_at timestamp,
	updated_at timestamp
);

CREATE TABLE todos (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title text NOT NULL,
	completed boolean NOT NULL DEFAULT false,
	created_at timestamp NOT NULL,
	updated_at timestamp NOT NULL
);

CREATE INDEX todos_user_id_idx ON todos(user_id);
CREATE INDEX todos_user_id_completed_idx ON todos(user_id, completed);
