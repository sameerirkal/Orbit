"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Target,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type GoalStatus = "Active" | "Completed" | "Paused";

type Goal = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: GoalStatus;
  createdAt: number;
};

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number | null;
  status: string | null;
  created_at: string;
};

function normalizeStatus(status: string | null): GoalStatus {
  if (status === "Completed") return "Completed";
  if (status === "Paused") return "Paused";
  return "Active";
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    targetDate: row.target_date ?? "",
    progress: Math.min(100, Math.max(0, row.progress ?? 0)),
    status: normalizeStatus(row.status),
    createdAt: new Date(row.created_at).getTime(),
  };
}

export default function GoalsPage() {
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<GoalStatus>("Active");

  const loadGoals = useCallback(async (currentUserId: string) => {
    const { data, error: loadError } = await supabase
      .from("goals")
      .select("id, title, description, target_date, progress, status, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (loadError) {
      throw loadError;
    }

    setGoals(((data ?? []) as GoalRow[]).map(rowToGoal));
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();

        if (authError || !data.user) {
          router.replace("/login");
          return;
        }

        if (!active) return;

        setUserId(data.user.id);

        const { data: rows, error: loadError } = await supabase
          .from("goals")
          .select("id, title, description, target_date, progress, status, created_at")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false });

        if (loadError) throw loadError;

        if (active) {
          setGoals(((rows ?? []) as GoalRow[]).map(rowToGoal));
        }
      } catch (err) {
        console.error("Could not load goals:", err);
        if (active) {
          setError("Goals load nahi ho paaye. Please refresh karke dobara try karo.");
        }
      } finally {
        if (active) setReady(true);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  const visibleGoals = useMemo(
    () =>
      goals.filter((goal) => {
        const matchesQuery = `${goal.title} ${goal.description}`
          .toLowerCase()
          .includes(query.toLowerCase());

        return matchesQuery && (filter === "All" || goal.status === filter);
      }),
    [goals, query, filter]
  );

  function resetForm() {
    setTitle("");
    setDescription("");
    setTargetDate("");
    setProgress(0);
    setStatus("Active");
    setEditingId(null);
    setModalOpen(false);
  }

  function openCreate() {
    setError("");
    setTitle("");
    setDescription("");
    setTargetDate("");
    setProgress(0);
    setStatus("Active");
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(goal: Goal) {
    setError("");
    setTitle(goal.title);
    setDescription(goal.description);
    setTargetDate(goal.targetDate);
    setProgress(goal.progress);
    setStatus(goal.status);
    setEditingId(goal.id);
    setModalOpen(true);
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle || !userId || saving) return;

    setSaving(true);
    setError("");

    const cleanProgress =
      status === "Completed" ? 100 : Math.min(100, Math.max(0, progress));

    const payload = {
      user_id: userId,
      title: cleanTitle,
      description: description.trim(),
      target_date: targetDate || null,
      progress: cleanProgress,
      status,
    };

    try {
      if (editingId) {
        const { data, error: updateError } = await supabase
          .from("goals")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId)
          .select("id, title, description, target_date, progress, status, created_at")
          .single();

        if (updateError) throw updateError;

        const updatedGoal = rowToGoal(data as GoalRow);

        setGoals((current) =>
          current.map((goal) =>
            goal.id === editingId ? updatedGoal : goal
          )
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("goals")
          .insert(payload)
          .select("id, title, description, target_date, progress, status, created_at")
          .single();

        if (insertError) throw insertError;

        setGoals((current) => [rowToGoal(data as GoalRow), ...current]);
      }

      resetForm();
    } catch (err) {
      console.error("Could not save goal:", err);
      setError(
        "Goal save nahi hua. Internet connection aur Supabase settings check karo, phir dobara try karo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(goal: Goal) {
    if (!userId || saving) return;

    const confirmed = window.confirm(
      `Delete "${goal.title}"? Ye goal tumhare Orbit account se delete ho jayega.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("goals")
        .delete()
        .eq("id", goal.id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      setGoals((current) => current.filter((item) => item.id !== goal.id));
    } catch (err) {
      console.error("Could not delete goal:", err);
      setError("Goal delete nahi hua. Please dobara try karo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="goals-page">
      <header className="goals-topbar">
        <a
          className="goals-brand"
          href="/"
          aria-label="Back to Orbit dashboard"
        >
          <span className="goals-brand-mark">O</span>
          <span>
            <b>orbit</b>
            <small>GOALS, IN MOTION</small>
          </span>
        </a>

        <a className="back-link" href="/">
          <ArrowLeft size={15} /> Dashboard
        </a>
      </header>

      <section className="goals-content">
        <div className="goals-heading">
          <div>
            <div className="goals-eyebrow">YOUR WORKSPACE</div>
            <h1>Goals</h1>
            <p>Turn your ambitions into clear, trackable progress.</p>
          </div>

          <button
            className="goal-primary"
            onClick={openCreate}
            disabled={!ready || !userId || saving}
          >
            <Plus size={16} /> New goal
          </button>
        </div>

        <div className="goal-stats">
          <div className="goal-stat">
            <span>Total goals</span>
            <strong>{goals.length.toString().padStart(2, "0")}</strong>
          </div>

          <div className="goal-stat">
            <span>Active</span>
            <strong>
              {goals
                .filter((goal) => goal.status === "Active")
                .length.toString()
                .padStart(2, "0")}
            </strong>
          </div>

          <div className="goal-stat">
            <span>Completed</span>
            <strong>
              {goals
                .filter((goal) => goal.status === "Completed")
                .length.toString()
                .padStart(2, "0")}
            </strong>
          </div>
        </div>

        <div className="goals-toolbar">
          <label className="goal-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search goals..."
            />
          </label>

          <select
            aria-label="Filter goals"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All</option>
            <option>Active</option>
            <option>Paused</option>
            <option>Completed</option>
          </select>
        </div>

        {error && (
          <div role="alert" className="goals-empty">
            {error}
            <button
              className="goal-secondary"
              onClick={() => {
                setError("");
                if (userId) {
                  loadGoals(userId).catch((err) => {
                    console.error(err);
                    setError("Goals reload nahi ho paaye. Please refresh karo.");
                  });
                }
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!ready ? (
          <div className="goals-empty">Loading your goals…</div>
        ) : visibleGoals.length === 0 ? (
          <div className="goals-empty">
            <div className="empty-icon">
              <Target size={24} />
            </div>
            <h2>
              {goals.length === 0
                ? "Your next big thing starts here."
                : "No goals match this view."}
            </h2>
            <p>
              {goals.length === 0
                ? "Create your first goal. You can add a target date, description, and update progress anytime."
                : "Try another search or filter, or create a new goal."}
            </p>

            {goals.length === 0 && (
              <button className="goal-primary" onClick={openCreate}>
                <Plus size={16} /> Create your first goal
              </button>
            )}
          </div>
        ) : (
          <div className="goals-grid">
            {visibleGoals.map((goal) => (
              <article className="goal-card" key={goal.id}>
                <div className="goal-card-top">
                  <div className="goal-card-icon">
                    <Target size={19} />
                  </div>
                  <span
                    className={`goal-status status-${goal.status.toLowerCase()}`}
                  >
                    {goal.status}
                  </span>
                </div>

                <h2>{goal.title}</h2>

                <p className="goal-description">
                  {goal.description || "No description added yet."}
                </p>

                <div className="goal-progress-label">
                  <span>Progress</span>
                  <strong>{goal.progress}%</strong>
                </div>

                <div className="goal-progress-track">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                <div className="goal-card-footer">
                  <span>
                    {goal.targetDate
                      ? `Target · ${new Date(
                          `${goal.targetDate}T12:00:00`
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}`
                      : "No target date"}
                  </span>

                  <div className="goal-card-actions">
                    <button
                      aria-label={`Edit ${goal.title}`}
                      onClick={() => openEdit(goal)}
                      disabled={saving}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      aria-label={`Delete ${goal.title}`}
                      onClick={() => deleteGoal(goal)}
                      disabled={saving}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="goals-storage-note">
          <Check size={13} /> Your goals are securely saved to your Orbit
          account and sync across devices.
        </p>
      </section>

      {modalOpen && (
        <div
          className="goal-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <form
            className="goal-modal"
            onSubmit={saveGoal}
            aria-labelledby="goal-modal-title"
          >
            <div className="goal-modal-header">
              <div>
                <span className="goals-eyebrow">
                  {editingId ? "UPDATE YOUR PLAN" : "MAKE IT HAPPEN"}
                </span>
                <h2 id="goal-modal-title">
                  {editingId ? "Edit goal" : "Create a goal"}
                </h2>
              </div>

              <button
                type="button"
                className="goal-close"
                aria-label="Close"
                onClick={resetForm}
                disabled={saving}
              >
                <X size={17} />
              </button>
            </div>

            <label>
              Goal name <span>*</span>
              <input
                required
                maxLength={100}
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Launch my first product"
              />
            </label>

            <label>
              Description
              <textarea
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Why does this goal matter? What does success look like?"
                rows={3}
              />
            </label>

            <div className="goal-form-row">
              <label>
                Target date
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={status}
                  onChange={(event) => {
                    const value = event.target.value as GoalStatus;
                    setStatus(value);
                    if (value === "Completed") setProgress(100);
                  }}
                >
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Completed</option>
                </select>
              </label>
            </div>

            <label>
              Progress{" "}
              <strong className="range-value">
                {status === "Completed" ? 100 : progress}%
              </strong>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={status === "Completed" ? 100 : progress}
                disabled={status === "Completed" || saving}
                onChange={(event) => setProgress(Number(event.target.value))}
              />
            </label>

            <div className="goal-modal-actions">
              <button
                type="button"
                className="goal-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="goal-primary"
                disabled={saving || !userId}
              >
                <Check size={15} />
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create goal"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}