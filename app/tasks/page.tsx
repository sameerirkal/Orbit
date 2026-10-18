"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  title: string;
  description: string | null;
  goal_id: string | null;
  priority: string;
  due_date: string | null;
  completed: boolean;
};

type Goal = {
  id: string;
  title: string;
};

export default function TasksPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [goalId, setGoalId] = useState("");

  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    setError("");

    const [tasksResult, goalsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, description, goal_id, priority, due_date, completed")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("goals")
        .select("id, title")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (tasksResult.error) {
      setError(`Tasks load nahi hue: ${tasksResult.error.message}`);
    } else {
      setTasks((tasksResult.data ?? []) as Task[]);
    }

    if (goalsResult.error) {
      setError((previous) =>
        previous
          ? `${previous} | Goals load nahi hue: ${goalsResult.error.message}`
          : `Goals load nahi hue: ${goalsResult.error.message}`
      );
    } else {
      setGoals((goalsResult.data ?? []) as Goal[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);
      await loadData(session.user.id);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, loadData]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDueDate("");
    setGoalId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !title.trim()) {
      setError("Task ka title zaroori hai.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const values = {
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      goal_id: goalId || null,
      user_id: userId,
    };

    const result = editingId
      ? await supabase
          .from("tasks")
          .update(values)
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("tasks").insert(values);

    if (result.error) {
      setError(`Task save nahi hua: ${result.error.message}`);
    } else {
      setNotice(editingId ? "Task updated!" : "New task added!");
      resetForm();
      await loadData(userId);
    }

    setSaving(false);
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority || "Medium");
    setDueDate(task.due_date ?? "");
    setGoalId(task.goal_id ?? "");
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleComplete(task: Task) {
    if (!userId) return;

    setError("");
    setNotice("");

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id)
      .eq("user_id", userId);

    if (updateError) {
      setError(`Task update nahi hua: ${updateError.message}`);
      return;
    }

    setTasks((previous) =>
      previous.map((item) =>
        item.id === task.id
          ? { ...item, completed: !task.completed }
          : item
      )
    );
  }

  async function deleteTask(task: Task) {
    if (!userId) return;

    const confirmed = window.confirm(
      `Kya tum "${task.title}" ko delete karna chahte ho?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(`Task delete nahi hua: ${deleteError.message}`);
      return;
    }

    setTasks((previous) => previous.filter((item) => item.id !== task.id));

    if (editingId === task.id) resetForm();

    setNotice("Task delete ho gaya.");
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && task.completed) ||
      (statusFilter === "pending" && !task.completed);

    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              My Tasks
            </h1>

            <p className="mt-2 text-slate-400">
              Plan your work. Track your progress. Stay focused.
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Log out
          </button>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Tasks</p>
            <p className="mt-2 text-3xl font-bold">{tasks.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Pending</p>
            <p className="mt-2 text-3xl font-bold text-amber-400">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Completed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {completedCount}
            </p>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-800 bg-red-950/60 p-4 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-800 bg-emerald-950/60 p-4 text-sm text-emerald-200"
          >
            {notice}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="mb-5 text-xl font-semibold">
            {editingId ? "Edit Task" : "Create a Task"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="task-title"
                className="mb-2 block text-sm text-slate-300"
              >
                Task title *
              </label>
              <input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Finish my project"
                required
                maxLength={200}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="task-description"
                className="mb-2 block text-sm text-slate-300"
              >
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a few details..."
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="task-priority"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-due-date"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Due date
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label
                  htmlFor="task-goal"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Related goal
                </label>
                <select
                  id="task-goal"
                  value={goalId}
                  onChange={(event) => setGoalId(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  <option value="">No goal selected</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">All Tasks</h2>
            <p className="mt-1 text-sm text-slate-400">
              Search, filter, edit, or complete your tasks.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              aria-label="Search tasks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks..."
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
            >
              <option value="all">All priorities</option>
              <option value="High">High priority</option>
              <option value="Medium">Medium priority</option>
              <option value="Low">Low priority</option>
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Loading your tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center">
              <p className="text-lg font-medium">No tasks found</p>
              <p className="mt-2 text-sm text-slate-400">
                Add a task above, or change your search and filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const relatedGoal = goals.find(
                  (goal) => goal.id === task.goal_id
                );

                return (
                  <article
                    key={task.id}
                    className={`rounded-2xl border bg-slate-900 p-5 transition ${
                      task.completed
                        ? "border-emerald-900/70"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleComplete(task)}
                          aria-label={`Mark ${task.title} ${
                            task.completed ? "pending" : "completed"
                          }`}
                          className="mt-1 h-5 w-5 shrink-0 accent-emerald-500"
                        />

                        <div className="min-w-0">
                          <h3
                            className={`break-words font-semibold ${
                              task.completed
                                ? "text-slate-500 line-through"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-400">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span
                              className={`rounded-full px-3 py-1 ${
                                task.priority === "High"
                                  ? "bg-red-950 text-red-300"
                                  : task.priority === "Low"
                                    ? "bg-blue-950 text-blue-300"
                                    : "bg-amber-950 text-amber-300"
                              }`}
                            >
                              {task.priority || "Medium"} Priority
                            </span>

                            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                              {task.completed ? "Completed" : "Pending"}
                            </span>

                            {task.due_date && (
                              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                                Due: {task.due_date}
                              </span>
                            )}

                            {relatedGoal && (
                              <span className="rounded-full bg-cyan-950 px-3 py-1 text-cyan-300">
                                Goal: {relatedGoal.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteTask(task)}
                          className="rounded-lg border border-red-900/70 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-800 pt-5 text-center text-sm text-slate-500">
          Orbit · Your goals, your tasks, your progress.
        </footer>
      </div>
    </main>
  );
}