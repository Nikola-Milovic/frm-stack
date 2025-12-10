import type { Selectable } from "kysely";
import type { Todos, Users } from "#schema";

export type User = Selectable<Users>;
export type Todo = Selectable<Todos>;
