"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Target, Pencil, Trash2, X, Check, Search } from "lucide-react";

type Goal = {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: "Active" | "Completed" | "Paused";
  createdAt: number;
};

const STORAGE_KEY = "orbit-goals-v1";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Goal["status"]>("Active");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setGoals(JSON.parse(saved) as Goal[]);
    } catch {
      // If browser storage is unavailable or corrupted, start with an empty list.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals, ready]);

  const visibleGoals = useMemo(() => goals.filter((goal) => {
    const matchesQuery = `${goal.title} ${goal.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "All" || goal.status === filter);
  }), [goals, query, filter]);

  function resetForm() {
    setTitle(""); setDescription(""); setTargetDate(""); setProgress(0); setStatus("Active");
    setEditingId(null); setModalOpen(false);
  }

  function openCreate() {
    setTitle(""); setDescription(""); setTargetDate(""); setProgress(0); setStatus("Active");
    setEditingId(null); setModalOpen(true);
  }

  function openEdit(goal: Goal) {
    setTitle(goal.title); setDescription(goal.description); setTargetDate(goal.targetDate);
    setProgress(goal.progress); setStatus(goal.status); setEditingId(goal.id); setModalOpen(true);
  }

  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const nextGoal: Goal = {
      id: editingId ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())),
      title: cleanTitle,
      description: description.trim(),
      targetDate,
      progress: status === "Completed" ? 100 : Math.min(100, Math.max(0, progress)),
      status,
      createdAt: editingId ? (goals.find((goal) => goal.id === editingId)?.createdAt ?? Date.now()) : Date.now(),
    };
    setGoals((current) => editingId
      ? current.map((goal) => goal.id === editingId ? nextGoal : goal)
      : [nextGoal, ...current]);
    resetForm();
  }

  function deleteGoal(goal: Goal) {
    if (window.confirm(`Delete “${goal.title}”? This removes it from this browser's Orbit goals list.`)) {
      setGoals((current) => current.filter((item) => item.id !== goal.id));
    }
  }

  return (
    <main className="goals-page">
      <header className="goals-topbar">
        <a className="goals-brand" href="/" aria-label="Back to Orbit dashboard"><span className="goals-brand-mark">O</span><span><b>orbit</b><small>GOALS, IN MOTION</small></span></a>
        <a className="back-link" href="/"><ArrowLeft size={15} /> Dashboard</a>
      </header>
      <section className="goals-content">
        <div className="goals-heading">
          <div><div className="goals-eyebrow">YOUR WORKSPACE</div><h1>Goals</h1><p>Turn your ambitions into clear, trackable progress.</p></div>
          <button className="goal-primary" onClick={openCreate}><Plus size={16} /> New goal</button>
        </div>

        <div className="goal-stats">
          <div className="goal-stat"><span>Total goals</span><strong>{goals.length.toString().padStart(2, "0")}</strong></div>
          <div className="goal-stat"><span>Active</span><strong>{goals.filter(g => g.status === "Active").length.toString().padStart(2, "0")}</strong></div>
          <div className="goal-stat"><span>Completed</span><strong>{goals.filter(g => g.status === "Completed").length.toString().padStart(2, "0")}</strong></div>
        </div>

        <div className="goals-toolbar">
          <label className="goal-search"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search goals..." /></label>
          <select aria-label="Filter goals" value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Active</option><option>Paused</option><option>Completed</option></select>
        </div>

        {!ready ? <div className="goals-empty">Loading your goals…</div> : visibleGoals.length === 0 ? (
          <div className="goals-empty">
            <div className="empty-icon"><Target size={24} /></div>
            <h2>{goals.length === 0 ? "Your next big thing starts here." : "No goals match this view."}</h2>
            <p>{goals.length === 0 ? "Create your first goal. You can add a target date, description, and update progress anytime." : "Try another search or filter, or create a new goal."}</p>
            {goals.length === 0 && <button className="goal-primary" onClick={openCreate}><Plus size={16} /> Create your first goal</button>}
          </div>
        ) : (
          <div className="goals-grid">
            {visibleGoals.map(goal => (
              <article className="goal-card" key={goal.id}>
                <div className="goal-card-top"><div className="goal-card-icon"><Target size={19} /></div><span className={`goal-status status-${goal.status.toLowerCase()}`}>{goal.status}</span></div>
                <h2>{goal.title}</h2>
                <p className="goal-description">{goal.description || "No description added yet."}</p>
                <div className="goal-progress-label"><span>Progress</span><strong>{goal.progress}%</strong></div>
                <div className="goal-progress-track"><div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} /></div>
                <div className="goal-card-footer"><span>{goal.targetDate ? `Target · ${new Date(`${goal.targetDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : "No target date"}</span><div className="goal-card-actions"><button aria-label={`Edit ${goal.title}`} onClick={() => openEdit(goal)}><Pencil size={14} /></button><button aria-label={`Delete ${goal.title}`} onClick={() => deleteGoal(goal)}><Trash2 size={14} /></button></div></div>
              </article>
            ))}
          </div>
        )}
        <p className="goals-storage-note"><Check size={13} /> Goals are saved in this browser on this device. They do not sync across devices yet.</p>
      </section>

      {modalOpen && <div className="goal-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) resetForm(); }}>
        <form className="goal-modal" onSubmit={saveGoal} aria-labelledby="goal-modal-title">
          <div className="goal-modal-header"><div><span className="goals-eyebrow">{editingId ? "UPDATE YOUR PLAN" : "MAKE IT HAPPEN"}</span><h2 id="goal-modal-title">{editingId ? "Edit goal" : "Create a goal"}</h2></div><button type="button" className="goal-close" aria-label="Close" onClick={resetForm}><X size={17} /></button></div>
          <label>Goal name <span>*</span><input required maxLength={100} autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Launch my first product" /></label>
          <label>Description<textarea maxLength={500} value={description} onChange={e => setDescription(e.target.value)} placeholder="Why does this goal matter? What does success look like?" rows={3} /></label>
          <div className="goal-form-row"><label>Target date<input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} /></label><label>Status<select value={status} onChange={e => { const value = e.target.value as Goal["status"]; setStatus(value); if (value === "Completed") setProgress(100); }}><option>Active</option><option>Paused</option><option>Completed</option></select></label></div>
          <label>Progress <strong className="range-value">{status === "Completed" ? 100 : progress}%</strong><input type="range" min="0" max="100" step="5" value={status === "Completed" ? 100 : progress} disabled={status === "Completed"} onChange={e => setProgress(Number(e.target.value))} /></label>
          <div className="goal-modal-actions"><button type="button" className="goal-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="goal-primary"><Check size={15} /> {editingId ? "Save changes" : "Create goal"}</button></div>
        </form>
      </div>}
    </main>
  );
}
