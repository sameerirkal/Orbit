"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Flag,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "My Tasks", icon: ListTodo, href: "/tasks" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Analytics", icon: TrendingUp, href: "/analytics" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  progress: number | null;
  status: string | null;
  target_date: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  goal_id: string | null;
  priority: string | null;
  due_date: string | null;
  completed: boolean | null;
};

type DashboardGoal = {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
  icon: typeof Compass;
};

type DashboardTask = {
  id: string;
  title: string;
  due: string;
  dueDate: string | null;
  priority: string;
  done: boolean;
};

function formatDueDate(value: string | null) {
  if (!value) return "No due date";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "No due date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) return "Today";
  if (dateOnly.getTime() === tomorrow.getTime()) return "Tomorrow";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriority(value: string | null) {
  const normalized = (value ?? "Medium").toLowerCase();

  if (normalized === "high") return "high";
  if (normalized === "low") return "low";

  return "medium";
}

export default function OrbitDashboard() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [goals, setGoals] = useState<DashboardGoal[]>([]);

  const [totalGoals, setTotalGoals] = useState(0);
  const [completedGoals, setCompletedGoals] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [loggingOutError, setLoggingOutError] = useState("");

  const loadDashboardData = useCallback(async (currentUserId: string) => {
    setLoadingData(true);
    setDashboardError("");

    try {
      const [goalsResult, tasksResult] = await Promise.all([
        supabase
          .from("goals")
          .select("id, title, description, progress, status, target_date")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),

        supabase
          .from("tasks")
          .select(
            "id, title, description, goal_id, priority, due_date, completed"
          )
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
      ]);

      if (goalsResult.error) throw goalsResult.error;
      if (tasksResult.error) throw tasksResult.error;

      const goalRows = (goalsResult.data ?? []) as GoalRow[];
      const taskRows = (tasksResult.data ?? []) as TaskRow[];

      setTotalGoals(goalRows.length);
      setCompletedGoals(
        goalRows.filter((goal) => goal.status === "Completed").length
      );
      setTotalTasks(taskRows.length);

      // Statistics use ALL goals, not only the three shown on the dashboard.
      setGoals(
        goalRows.slice(0, 3).map((goal, index) => ({
          id: goal.id,
          title: goal.title,
          subtitle: goal.target_date
            ? `Target · ${formatDueDate(goal.target_date)}`
            : goal.description || "Personal goal",
          progress: Math.min(100, Math.max(0, goal.progress ?? 0)),
          icon: index === 0 ? Compass : index === 1 ? Activity : Flag,
        }))
      );

      setTasks(
        taskRows.map((task) => ({
          id: task.id,
          title: task.title,
          due: formatDueDate(task.due_date),
          dueDate: task.due_date,
          priority: getPriority(task.priority),
          done: Boolean(task.completed),
        }))
      );
    } catch (error) {
      console.error("Dashboard data load failed:", error);
      setDashboardError(
        "Dashboard data load nahi ho paaya. Please refresh karke try karo."
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setUserId(data.user.id);
      setAuthChecking(false);
      void loadDashboardData(data.user.id);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);
      setAuthChecking(false);
      void loadDashboardData(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, loadDashboardData]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLoggingOutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoggingOut(false);
      setLoggingOutError("Logout nahi hua. Dobara try karo.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  async function addTask() {
    const title = newTask.trim();

    if (!title || !userId || addingTask) return;

    setAddingTask(true);
    setDashboardError("");

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title,
          description: "",
          priority: "Medium",
          completed: false,
        })
        .select(
          "id, title, description, goal_id, priority, due_date, completed"
        )
        .single();

      if (error) throw error;

      const row = data as TaskRow;

      setTasks((current) => [
        {
          id: row.id,
          title: row.title,
          due: formatDueDate(row.due_date),
          dueDate: row.due_date,
          priority: getPriority(row.priority),
          done: Boolean(row.completed),
        },
        ...current,
      ]);

      setTotalTasks((count) => count + 1);
      setNewTask("");
      setShowQuickAdd(false);
    } catch (error) {
      console.error("Task creation failed:", error);
      setDashboardError(
        "Task save nahi hua. Internet aur Supabase settings check karo."
      );
    } finally {
      setAddingTask(false);
    }
  }

  async function toggleTask(task: DashboardTask) {
    if (!userId || updatingTaskId) return;

    setUpdatingTaskId(task.id);
    setDashboardError("");

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.done })
        .eq("id", task.id)
        .eq("user_id", userId);

      if (error) throw error;

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, done: !task.done } : item
        )
      );
    } catch (error) {
      console.error("Task update failed:", error);
      setDashboardError("Task update nahi hua. Dobara try karo.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (authChecking) {
    return (
      <div style={{ padding: 40, color: "white" }}>Checking login...</div>
    );
  }

  const activeGoals = Math.max(0, totalGoals - completedGoals);
  const completedTasks = tasks.filter((task) => task.done).length;
  const pendingTasks = totalTasks - completedTasks;

  // The progress statistic is based on every goal fetched from Supabase.
  // The visible goals list remains limited to three for the existing layout.
  const overallProgress =
    totalGoals > 0 && goals.length > 0
      ? Math.round(
          goals.reduce((sum, goal) => sum + goal.progress, 0) /
            goals.length
        )
      : 0;


  // Separate overdue tasks from deadlines due in the next 7 days.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const overdueTasks = tasks
    .filter(
      (task) => !task.done && task.dueDate && task.dueDate.slice(0, 10) < todayKey
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const dueSoonTasks = tasks
    .filter((task) => {
      if (task.done || !task.dueDate) return false;

      const dateKey = task.dueDate.slice(0, 10);
      const nextWeekKey = [
        nextWeek.getFullYear(),
        String(nextWeek.getMonth() + 1).padStart(2, "0"),
        String(nextWeek.getDate()).padStart(2, "0"),
      ].join("-");

      return dateKey >= todayKey && dateKey <= nextWeekKey;
    })
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));


  return (
    <div className="app-shell">
      <button
        aria-label="Close navigation"
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">O</div>
          <div>
            <div className="brand-name">orbit</div>
            <div className="brand-sub">GOALS, IN MOTION</div>
          </div>
        </div>

        <div className="nav-label">Workspace</div>

        <nav aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                setActive(label);
                setMenuOpen(false);

                if (href !== "/") {
                  router.push(href);
                } else {
                  router.push("/");
                }
              }}
            >
              <span className="nav-icon">
                <Icon size={17} />
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-label" style={{ marginTop: 22 }}>
          Personal
        </div>

        <button
          className="nav-item"
          onClick={() => {
            setMenuOpen(false);
            router.push("/settings");
          }}
        >
          <span className="nav-icon">
            <Settings size={17} />
          </span>
          Settings
        </button>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={17} color="#a5b4fc" />

            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 10 }}>
              Make room for big goals
            </div>

            <p>
              Your personal command center for turning plans into progress.
            </p>

            <button
              className="outline-button"
              onClick={() => router.push("/goals")}
            >
              Explore goals{" "}
              <ArrowUpRight
                size={12}
                style={{ display: "inline", verticalAlign: "middle" }}
              />
            </button>
          </div>

          <button
            className="nav-item"
            style={{ marginTop: 14 }}
            onClick={() =>
              alert("Help center will be added in a future phase.")
            }
          >
            <span className="nav-icon">
              <CircleHelp size={17} />
            </span>
            Help &amp; feedback
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="breadcrumb">
              Workspace
              <span style={{ color: "#46516a", margin: "0 8px" }}>/</span>
              <span style={{ color: "#e2e8f0" }}>{active}</span>
            </div>
          </div>

          <div className="top-actions">
            <button
              className="search-box"
              onClick={() => router.push("/tasks")}
              aria-label="Search tasks"
            >
              <Search size={14} />
              <span>Search workspace</span>
              <span style={{ marginLeft: "auto", color: "#65718a" }}>
                ⌘ K
              </span>
            </button>

            <button
              className="quick-add"
              onClick={() => setShowQuickAdd(true)}
            >
              <Plus size={15} />
              <span>Quick Add</span>
            </button>

            <button
              aria-label="Notifications"
              className="outline-button notification-button"
              onClick={() =>
                alert("Notifications will be connected in a future phase.")
              }
            >
              <Bell size={15} />
            </button>

            <button
              aria-label="Profile menu"
              className="avatar"
              onClick={() => router.push("/settings")}
            >
              YO
            </button>

            <button
              className="outline-button logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={14} />
              <span className="logout-label">
                {loggingOut ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{todayLabel}</div>

              <h1>Your orbit, at a glance.</h1>

              <div className="muted text-sm">
                Small steps today. Remarkable progress over time.
              </div>
            </div>

            <button
              className="outline-button"
              onClick={() => router.push("/goals")}
            >
              <Target
                size={14}
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: 7,
                }}
              />
              View goals{" "}
              <ChevronDown
                size={13}
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  marginLeft: 5,
                }}
              />
            </button>
          </div>

          {dashboardError && (
            <div className="notice" role="alert">
              {dashboardError}{" "}
              <button
                className="outline-button"
                onClick={() => {
                  if (userId) void loadDashboardData(userId);
                }}
              >
                Retry
              </button>
            </div>
          )}

          {loggingOutError && (
            <div className="notice" role="alert">
              {loggingOutError}
            </div>
          )}

          <section className="stats-grid" aria-label="Workspace overview">
            {[
              {
                label: "Active goals",
                value: loadingData ? "…" : String(activeGoals).padStart(2, "0"),
                foot: `${completedGoals} completed · ${totalGoals} total`,
                icon: Target,
              },
              {
                label: "Pending tasks",
                value: loadingData ? "…" : String(pendingTasks).padStart(2, "0"),
                foot: `${totalTasks} total tasks`,
                icon: FolderKanban,
              },
              {
                label: "Tasks completed",
                value: loadingData
                  ? "…"
                  : String(completedTasks).padStart(2, "0"),
                foot: "Saved in your account",
                icon: Check,
              },
              {
                label: "Overall progress",
                value: loadingData ? "…" : `${overallProgress}%`,
                foot: "Based on visible goals",
                icon: TrendingUp,
              },
            ].map(({ label, value, foot, icon: Icon }) => (
              <div className="panel stat-card" key={label}>
                <div className="stat-top">
                  <span>{label}</span>
                  <span className="stat-icon">
                    <Icon size={16} />
                  </span>
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-foot">{foot}</div>
              </div>
            ))}
          </section>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>Goals in motion</h2>
                <button
                  className="outline-button"
                  onClick={() => router.push("/goals")}
                >
                  All goals{" "}
                  <ArrowUpRight
                    size={12}
                    style={{ display: "inline", verticalAlign: "middle" }}
                  />
                </button>
              </div>

              <div className="panel-body">
                {loadingData ? (
                  <p className="muted text-sm">Loading goals...</p>
                ) : goals.length === 0 ? (
                  <p className="muted text-sm">
                    No goals yet. Create your first goal to see it here.
                  </p>
                ) : (
                  goals.map(({ id, icon: Icon, title, subtitle, progress }) => (
                    <div className="goal-row" key={id}>
                      <div className="goal-badge">
                        <Icon size={19} />
                      </div>

                      <div className="goal-info">
                        <div className="goal-title">{title}</div>
                        <div className="goal-meta">{subtitle}</div>
                        <div className="progress-line">
                          <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="percent">{progress}%</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Today&apos;s focus</h2>
                <span className="muted" style={{ fontSize: 11 }}>
                  {pendingTasks} remaining
                </span>
              </div>

              <div className="panel-body">
                {loadingData ? (
                  <p className="muted text-sm">Loading tasks...</p>
                ) : tasks.length === 0 ? (
                  <p className="muted text-sm">
                    No tasks yet. Use Quick Add to create one.
                  </p>
                ) : (
                  tasks.slice(0, 8).map((task) => (
                    <div className="task-row" key={task.id}>
                      <button
                        aria-label={
                          task.done
                            ? "Mark task incomplete"
                            : "Mark task complete"
                        }
                        className={`task-check ${task.done ? "checked" : ""}`}
                        disabled={updatingTaskId === task.id}
                        onClick={() => void toggleTask(task)}
                      >
                        {task.done ? <Check size={12} /> : null}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="task-title"
                          style={{
                            textDecoration: task.done ? "line-through" : "none",
                            color: task.done ? "#74819a" : "#e2e8f0",
                          }}
                        >
                          {task.title}
                        </div>
                        <div className="task-due">{task.due}</div>
                      </div>

                      {!task.done && (
                        <span className={`priority ${task.priority}`}>
                          {task.priority === "high"
                            ? "High"
                            : task.priority === "low"
                              ? "Low"
                              : "Medium"}
                        </span>
                      )}
                    </div>
                  ))
                )}

                <button
                  className="outline-button"
                  style={{ width: "100%", marginTop: 10 }}
                  onClick={() => router.push("/tasks")}
                >
                  View all tasks{" "}
                  <ArrowUpRight
                    size={12}
                    style={{ display: "inline", verticalAlign: "middle" }}
                  />
                </button>

                <button
                  className="outline-button"
                  style={{ width: "100%", marginTop: 8 }}
                  onClick={() => setShowQuickAdd(true)}
                >
                  <Plus
                    size={13}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: 5,
                    }}
                  />
                  Add a task
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Upcoming deadlines</h2>
                <CalendarDays size={16} color="#8490a8" />
              </div>

              <div className="panel-body">

{loadingData ? (
  <p className="muted text-sm">Loading deadlines...</p>
) : overdueTasks.length === 0 && dueSoonTasks.length === 0 ? (
  <p className="muted text-sm">
    No upcoming deadlines. Add due dates to your tasks to see them here.
  </p>
) : (
  <>
    {overdueTasks.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: "#f87171", marginBottom: 8 }}>
          Overdue ({overdueTasks.length})
        </h3>
        {overdueTasks.map((task) => (
          <div className="milestone" key={task.id}>
            <span className="milestone-dot" style={{ background: "#f87171" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="milestone-title">{task.title}</div>
              <div className="milestone-date">
                {formatDueDate(task.dueDate)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {dueSoonTasks.length > 0 && (
      <div>
        <h3 style={{ marginBottom: 8 }}>
          Due in the next 7 days ({dueSoonTasks.length})
        </h3>
        {dueSoonTasks.slice(0, 5).map((task) => (
          <div className="milestone" key={task.id}>
            <span className="milestone-dot" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="milestone-title">{task.title}</div>
              <div className="milestone-date">
                {formatDueDate(task.dueDate)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
)}

              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Build Orbit</h2>
                <span className="eyebrow" style={{ letterSpacing: 1 }}>
                  DEV HQ
                </span>
              </div>

              <div className="panel-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span className="muted text-sm">Core features</span>
                  <strong style={{ fontSize: 20 }}>3/5</strong>
                </div>

                <div
                  className="progress-line"
                  style={{ marginTop: 13, height: 7 }}
                >
                  <div
                    className="progress-fill"
                    style={{ width: "60%" }}
                  />
                </div>

                <p
                  className="muted text-sm"
                  style={{ lineHeight: 1.7, marginTop: 16 }}
                >
                  Goals, tasks, and dashboard statistics now use your account
                  data. More workspace features can be added next.
                </p>

                <button
                  className="outline-button"
                  onClick={() => router.push("/tasks")}
                >
                  Open task manager{" "}
                  <ArrowUpRight
                    size={12}
                    style={{ display: "inline", verticalAlign: "middle" }}
                  />
                </button>
              </div>
            </section>
          </div>

          <div className="notice">
            <strong style={{ color: "#cbd5e1" }}>Orbit workspace:</strong>{" "}
            Goals, tasks, and projects are saved in your account.
            Calendar now brings task dates and project deadlines together.
            Analytics and Settings can be added next.
          </div>
        </div>
      </main>

      {showQuickAdd && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "#020617b8",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !addingTask) {
              setShowQuickAdd(false);
            }
          }}
        >
          <div
            className="panel"
            style={{
              width: "min(100%, 440px)",
              padding: 22,
              boxShadow: "0 25px 90px #0008",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <div>
                <div className="eyebrow">QUICK CREATE</div>
                <h2
                  id="quick-add-title"
                  style={{ fontSize: 20, margin: "7px 0 0" }}
                >
                  Add a task
                </h2>
              </div>

              <button
                className="outline-button"
                aria-label="Close dialog"
                disabled={addingTask}
                onClick={() => setShowQuickAdd(false)}
              >
                <X size={15} />
              </button>
            </div>

            <label htmlFor="task-title" className="muted text-sm">
              Task name
            </label>

            <input
              id="task-title"
              autoFocus
              maxLength={200}
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addTask();
                }
              }}
              placeholder="e.g. Sketch the roadmap page"
              style={{
                display: "block",
                width: "100%",
                margin: "8px 0 18px",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #303b54",
                background: "#0b1020",
                color: "#f1f5f9",
                outline: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
              }}
            >
              <button
                className="outline-button"
                disabled={addingTask}
                onClick={() => setShowQuickAdd(false)}
              >
                Cancel
              </button>

              <button
                className="quick-add"
                disabled={addingTask || !newTask.trim()}
                onClick={() => void addTask()}
              >
                <Plus size={14} />
                <span>{addingTask ? "Saving..." : "Create task"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
