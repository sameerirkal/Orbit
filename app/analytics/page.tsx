
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  CircleDashed,
  Target,
  FolderKanban,
  ListTodo,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean | null;
};

type Goal = {
  id: string;
  progress: number | null;
  status: string | null;
};

type ProjectStatus = "Planning" | "In Progress" | "Completed";

type Project = {
  id: string;
  name: string;
  progress: number | null;
  status: ProjectStatus | null;
};

export default function AnalyticsPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login");
        return;
      }

      const userId = authData.user.id;

      const [taskResult, goalResult, projectResult] =
        await Promise.all([
          supabase
            .from("tasks")
            .select("id, title, due_date, completed")
            .eq("user_id", userId),

          supabase
            .from("goals")
            .select("id, progress, status")
            .eq("user_id", userId),

          supabase
            .from("projects")
            .select("id, name, progress, status")
            .eq("user_id", userId),
        ]);

      if (taskResult.error) throw taskResult.error;
      if (goalResult.error) throw goalResult.error;
      if (projectResult.error) throw projectResult.error;

      setTasks((taskResult.data ?? []) as Task[]);
      setGoals((goalResult.data ?? []) as Goal[]);
      setProjects((projectResult.data ?? []) as Project[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analytics load nahi ho paaya."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const completedTasks = tasks.filter(
    (task) => task.completed === true
  ).length;

  const today = new Date();
today.setHours(0, 0, 0, 0);

const upcomingLimit = new Date(today);
upcomingLimit.setDate(upcomingLimit.getDate() + 7);

const overdueTasks = tasks.filter((task) => {
  if (task.completed || !task.due_date) return false;

  const due = new Date(`${task.due_date.slice(0, 10)}T00:00:00`);
  return !Number.isNaN(due.getTime()) && due < today;
});

const upcomingTasks = tasks.filter((task) => {
  if (task.completed || !task.due_date) return false;

  const due = new Date(`${task.due_date.slice(0, 10)}T00:00:00`);
  return (
    !Number.isNaN(due.getTime()) &&
    due >= today &&
    due <= upcomingLimit
  );
});

  const pendingTasks = tasks.length - completedTasks;

  const taskPercent = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const averageGoalProgress = goals.length
    ? Math.round(
        goals.reduce(
          (total, goal) =>
            total + Math.min(100, Math.max(0, goal.progress ?? 0)),
          0
        ) / goals.length
      )
    : 0;

  const averageProjectProgress = projects.length
    ? Math.round(
        projects.reduce(
          (total, project) =>
            total +
            Math.min(100, Math.max(0, project.progress ?? 0)),
          0
        ) / projects.length
      )
    : 0;

  const activeGoals = goals.filter(
    (goal) => goal.status !== "Completed" && goal.status !== "Paused"
  ).length;

  const completedGoals = goals.filter(
    (goal) => goal.status === "Completed"
  ).length;

  const pausedGoals = goals.filter(
    (goal) => goal.status === "Paused"
  ).length;

  const cards = [
    {
      title: "Total Tasks",
      value: tasks.length,
      detail: `${completedTasks} completed`,
      icon: ListTodo,
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      detail: `${taskPercent}% task completion`,
      icon: CircleDashed,
    },
    {
      title: "Goals",
      value: goals.length,
      detail: `${activeGoals} active · ${completedGoals} completed`,
      icon: Target,
    },
    {
      title: "Projects",
      value: projects.length,
      detail: `${averageProjectProgress}% average progress`,
      icon: FolderKanban,
    },

    {
  title: "Overdue Tasks",
  value: overdueTasks.length,
  detail: "Past-due incomplete tasks",
  icon: Activity,
},
{
  title: "Upcoming Deadlines",
  value: upcomingTasks.length,
  detail: "Due within 7 days",
  icon: Target,
},
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-cyan-400">
              ORBIT WORKSPACE
            </p>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="mt-2 text-slate-400">
              Apni productivity aur progress ka overview dekho.
            </p>
          </div>

          <button
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-12 text-slate-400">
            Analytics load ho raha hai...
          </p>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.title}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <p className="text-sm text-slate-400">
                        {card.title}
                      </p>
                      <Icon className="text-cyan-400" size={21} />
                    </div>

                    <p className="text-3xl font-bold">{card.value}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {card.detail}
                    </p>
                  </article>
                );
              })}
            </section>


<section className="mt-6 grid gap-6 lg:grid-cols-2">
  <article className="rounded-2xl border border-red-900/60 bg-slate-900 p-6">
    <h2 className="mb-4 text-lg font-semibold text-red-300">
      Overdue Tasks
    </h2>

    {overdueTasks.length === 0 ? (
      <p className="text-sm text-slate-400">
        Koi overdue task nahi hai.
      </p>
    ) : (
      <div className="space-y-4">
        {overdueTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3"
          >
            <p className="text-sm font-medium">{task.title}</p>
            <p className="shrink-0 text-xs text-red-300">
              Due: {task.due_date?.slice(0, 10)}
            </p>
          </div>
        ))}
      </div>
    )}
  </article>

  <article className="rounded-2xl border border-amber-900/60 bg-slate-900 p-6">
    <h2 className="mb-4 text-lg font-semibold text-amber-300">
      Upcoming Deadlines
    </h2>

    {upcomingTasks.length === 0 ? (
      <p className="text-sm text-slate-400">
        Agle 7 din mein koi deadline nahi hai.
      </p>
    ) : (
      <div className="space-y-4">
        {upcomingTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3"
          >
            <p className="text-sm font-medium">{task.title}</p>
            <p className="shrink-0 text-xs text-amber-300">
              Due: {task.due_date?.slice(0, 10)}
            </p>
          </div>
        ))}
      </div>
    )}
  </article>
</section>


            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Activity className="text-cyan-400" size={22} />
                  <h2 className="text-lg font-semibold">
                    Task Completion
                  </h2>
                </div>

                <div className="mb-3 flex items-end justify-between">
                  <span className="text-3xl font-bold">
                    {taskPercent}%
                  </span>
                  <span className="text-sm text-slate-400">
                    {completedTasks} of {tasks.length} tasks
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{ width: `${taskPercent}%` }}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-cyan-400" />
                    Completed: {completedTasks}
                  </span>
                  <span className="flex items-center gap-2">
                    <CircleDashed size={16} />
                    Pending: {pendingTasks}
                  </span>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Target className="text-violet-400" size={22} />
                  <h2 className="text-lg font-semibold">
                    Goals Progress
                  </h2>
                </div>

                <div className="mb-3 flex items-end justify-between">
                  <span className="text-3xl font-bold">
                    {averageGoalProgress}%
                  </span>
                  <span className="text-sm text-slate-400">
                    Average progress
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-violet-400 transition-all"
                    style={{ width: `${averageGoalProgress}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xl font-semibold">{activeGoals}</p>
                    <p className="text-slate-400">Active</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{completedGoals}</p>
                    <p className="text-slate-400">Completed</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{pausedGoals}</p>
                    <p className="text-slate-400">Paused</p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                <div className="mb-5 flex items-center gap-3">
                  <FolderKanban className="text-cyan-400" size={22} />
                  <h2 className="text-lg font-semibold">
                    Projects Progress
                  </h2>
                </div>

                {projects.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Abhi koi project nahi hai.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {projects.map((project) => {
                      const progress = Math.min(
                        100,
                        Math.max(0, project.progress ?? 0)
                      );

                      return (
                        <div key={project.id}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm text-slate-200">
                              {project.name}
                            </span>
                            <div className="flex items-center gap-3">
  <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
    {project.status ?? "Planning"}
  </span>
  <span className="text-sm text-slate-400">
    {progress}%
  </span>
</div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-cyan-400"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
