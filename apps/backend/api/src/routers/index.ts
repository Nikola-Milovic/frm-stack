import type { App } from "#app";
import { orpc } from "#orpc";
import { userRouter } from "#routers/user";
import { healthRouter } from "#routers/health";
import { todoRouter } from "#routers/todo";

export const router = () =>
  orpc.router({
    user: userRouter(),
    todo: todoRouter(),
  });

export type Router = ReturnType<typeof router>;

export function registerRoutes(app: App) {
  app.route("/health", healthRouter());
}
