import { useApi } from "#lib/api";
import { useSession } from "#providers/session-provider.tsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@yourcompany/web/components/base/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@yourcompany/web/components/base/card";
import { Checkbox } from "@yourcompany/web/components/base/checkbox";
import { Input } from "@yourcompany/web/components/base/input";

export default function IndexPage() {
  const { data: session } = useSession();
  const api = useApi();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;

  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const completedFilter = useMemo(() => {
    if (filter === "active") return false;
    if (filter === "completed") return true;
    return undefined;
  }, [filter]);

  const todosQuery = useQuery({
    ...api.todo.list.queryOptions({
      input: { completed: completedFilter },
    }),
    enabled: Boolean(userId),
  });

  const createTodoMutation = useMutation(
    api.todo.create.mutationOptions({
      onSuccess: async () => {
        setNewTitle("");
        await queryClient.invalidateQueries({ queryKey: api.todo.key() });
      },
      onError: (e) => {
        toast.error(`Failed to create todo: ${(e as Error).message}`);
      },
    }),
  );

  const updateTodoMutation = useMutation(
    api.todo.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: api.todo.key() });
      },
      onError: (e) => {
        toast.error(`Failed to update todo: ${(e as Error).message}`);
      },
    }),
  );

  const deleteTodoMutation = useMutation(
    api.todo.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: api.todo.key() });
      },
      onError: (e) => {
        toast.error(`Failed to delete todo: ${(e as Error).message}`);
      },
    }),
  );

  const todos = todosQuery.data ?? [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Todos</CardTitle>
          <CardDescription>A tiny full-stack CRUD demo (oRPC + React Query + Kysely)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add a todo…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const title = newTitle.trim();
                    if (!title) return;
                    createTodoMutation.mutate({ title });
                  }
                }}
              />
              <Button
                onClick={() => {
                  const title = newTitle.trim();
                  if (!title) return;
                  createTodoMutation.mutate({ title });
                }}
                disabled={createTodoMutation.isPending || newTitle.trim().length === 0}
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant={filter === "all" ? "default" : "secondary"} size="sm" onClick={() => setFilter("all")}>
                All
              </Button>
              <Button
                variant={filter === "active" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "secondary"}
                size="sm"
                onClick={() => setFilter("completed")}
              >
                Completed
              </Button>
            </div>

            {todosQuery.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {todosQuery.error && (
              <div className="text-sm text-destructive">
                Failed to load todos: {(todosQuery.error as Error).message}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {todos.length === 0 && !todosQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">No todos yet.</div>
              ) : null}

              {todos.map((todo) => {
                const isEditing = editingId === todo.id;
                return (
                  <div key={todo.id} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 shadow-sm">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={(checked) => {
                        updateTodoMutation.mutate({ id: todo.id, completed: Boolean(checked) });
                      }}
                      disabled={updateTodoMutation.isPending}
                    />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const title = editingTitle.trim();
                              if (!title) return;
                              updateTodoMutation.mutate({ id: todo.id, title });
                              setEditingId(null);
                              setEditingTitle("");
                            }
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditingTitle("");
                            }
                          }}
                        />
                      ) : (
                        <div className={todo.completed ? "line-through text-muted-foreground" : ""}>{todo.title}</div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const title = editingTitle.trim();
                            if (!title) return;
                            updateTodoMutation.mutate({ id: todo.id, title });
                            setEditingId(null);
                            setEditingTitle("");
                          }}
                          disabled={editingTitle.trim().length === 0 || updateTodoMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(null);
                            setEditingTitle("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(todo.id);
                            setEditingTitle(todo.title);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTodoMutation.mutate({ id: todo.id })}
                          disabled={deleteTodoMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
