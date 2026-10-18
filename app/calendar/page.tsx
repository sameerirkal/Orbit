
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean | null;
};

type Project = {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  due_date: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  kind: "task" | "project";
  completed?: boolean;
  status?: string | null;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCalendar = useCallback(async (uid: string) => {
    setLoading(true);
    setError("");

    try {
      const [taskResult, projectResult] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, due_date, completed")
          .eq("user_id", uid)
          .order("due_date", { ascending: true }),

        supabase
          .from("projects")
          .select("id, name, status, start_date, due_date")
          .eq("user_id", uid)
          .order("due_date", { ascending: true }),
      ]);

      if (taskResult.error) throw taskResult.error;
      if (projectResult.error) throw projectResult.error;

      setTasks((taskResult.data ?? []) as Task[]);
      setProjects((projectResult.data ?? []) as Project[]);
    } catch (err) {
      console.error("Calendar load failed:", err);
      setError(
        err instanceof Error
          ? `Calendar load nahi hua: ${err.message}`
          : "Calendar load nahi hua. Dobara try karo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error: authError } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      setUserId(data.user.id);
      await loadCalendar(data.user.id);
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session?.user) {
        setUserId(null);
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);
      void loadCalendar(session.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, loadCalendar]);

  const events = useMemo<CalendarEvent[]>(() => {
    const taskEvents: CalendarEvent[] = tasks.flatMap((task) =>
      task.due_date
        ? [{
            id: `task-${task.id}`,
            title: task.title,
            date: task.due_date.slice(0, 10),
            kind: "task" as const,
            completed: Boolean(task.completed),
          }]
        : []
    );

    const projectEvents: CalendarEvent[] = projects.flatMap((project) => {
      const dates: CalendarEvent[] = [];

      if (project.start_date) {
        dates.push({
          id: `project-start-${project.id}`,
          title: `${project.name} · Starts`,
          date: project.start_date.slice(0, 10),
          kind: "project",
          status: project.status,
        });
      }

      if (project.due_date) {
        dates.push({
          id: `project-due-${project.id}`,
          title: `${project.name} · Deadline`,
          date: project.due_date.slice(0, 10),
          kind: "project",
          status: project.status,
        });
      }

      return dates;
    });

    return [...taskEvents, ...projectEvents].filter(
      (event) => filter === "all" || event.kind === filter
    );
  }, [tasks, projects, filter]);

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(
      first.getFullYear(),
      first.getMonth(),
      1 - mondayOffset
    );

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const selectedEvents = events.filter(
    (event) => event.date === selectedDate
  );

  function changeMonth(amount: number) {
    const next = new Date(
      month.getFullYear(),
      month.getMonth() + amount,
      1
    );
    setMonth(next);
    setSelectedDate(dateKey(next));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold">
              <CalendarDays className="text-cyan-400" size={30} />
              Calendar
            </h1>
            <p className="mt-2 text-slate-400">
              Tasks, project starts, and deadlines in one place.
            </p>
          </div>

          <button
            onClick={() => {
              if (userId) void loadCalendar(userId);
            }}
            disabled={loading || !userId}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-800 bg-red-950/50 p-4 text-red-200">
            {error}
          </div>
        )}

        <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <button
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
              className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="min-w-40 text-center text-xl font-semibold">
              {month.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              aria-label="Next month"
              onClick={() => changeMonth(1)}
              className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date();
                setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDate(dateKey(today));
              }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Today
            </button>
            <select
              aria-label="Filter calendar events"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="all">Tasks & Projects</option>
              <option value="task">Tasks only</option>
              <option value="project">Projects only</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="grid grid-cols-7 border-b border-slate-800">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-slate-400 sm:text-sm">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400">
              Loading your calendar...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const key = dateKey(day);
                const inMonth = day.getMonth() === month.getMonth();
                const dayEvents = events.filter((event) => event.date === key);
                const selected = key === selectedDate;
                const today = key === dateKey(new Date());

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    aria-pressed={selected}
                    className={`min-h-20 border-b border-r border-slate-800 p-1.5 text-left transition sm:min-h-28 sm:p-2 ${
                      selected ? "bg-cyan-950/50 ring-1 ring-inset ring-cyan-500" : "hover:bg-slate-800/70"
                    } ${inMonth ? "" : "opacity-40"}`}
                  >
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      today ? "bg-cyan-500 font-bold text-slate-950" : "text-slate-200"
                    }`}>
                      {day.getDate()}
                    </span>

                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`truncate rounded px-1 py-0.5 text-[10px] sm:text-xs ${
                            event.kind === "task"
                              ? event.completed
                                ? "bg-emerald-950 text-emerald-300"
                                : "bg-cyan-950 text-cyan-200"
                              : "bg-violet-950 text-violet-200"
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-slate-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"}
          </p>

          {selectedEvents.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
              No tasks or project dates on this day.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedEvents.map((event) => (
                <article
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div>
                    <p className={`font-medium ${
                      event.kind === "task" && event.completed
                        ? "text-slate-500 line-through"
                        : "text-white"
                    }`}>
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {event.kind === "task"
                        ? event.completed ? "Completed task" : "Task deadline"
                        : `Project · ${event.status || "No status"}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${
                    event.kind === "task"
                      ? "bg-cyan-950 text-cyan-200"
                      : "bg-violet-950 text-violet-200"
                  }`}>
                    {event.kind === "task" ? "Task" : "Project"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-slate-800 pt-5 text-center text-sm text-slate-500">
          Orbit · Your goals, your tasks, your progress.
        </footer>
      </div>
    </main>
  );
}
