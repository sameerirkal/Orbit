"use client";

import { useState } from "react";
import {
  Activity, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp,
  Compass, Flag, FolderKanban, LayoutDashboard, ListTodo, Menu, Plus, Search,
  Settings, Sparkles, Target, TrendingUp, X
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Goals", icon: Target },
  { label: "Projects", icon: FolderKanban },
  { label: "My Tasks", icon: ListTodo },
  { label: "Calendar", icon: CalendarDays },
  { label: "Analytics", icon: TrendingUp },
];

const initialTasks = [
  { id: 1, title: "Finalize the Orbit design system", due: "Today · 4:00 PM", priority: "high", done: false },
  { id: 2, title: "Set up the project repository", due: "Today · 6:00 PM", priority: "medium", done: false },
  { id: 3, title: "Outline the first development milestone", due: "Tomorrow", priority: "medium", done: true },
];

const goals = [
  { icon: Compass, title: "Build Orbit", subtitle: "Product · 5 phases", progress: 28, color: "indigo" },
  { icon: Activity, title: "Grow my YouTube channel", subtitle: "Creator journey · 4 projects", progress: 46, color: "cyan" },
  { icon: Flag, title: "Level up my skills", subtitle: "Learning · 3 projects", progress: 17, color: "violet" },
];

export default function OrbitDashboard() {
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTask, setNewTask] = useState("");

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setTasks((current) => [...current, { id: Date.now(), title, due: "No due date", priority: "medium", done: false }]);
    setNewTask("");
    setShowQuickAdd(false);
  }

  return (
    <div className="app-shell">
      <button aria-label="Close navigation" className={`overlay ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">O</div>
          <div><div className="brand-name">orbit</div><div className="brand-sub">GOALS, IN MOTION</div></div>
        </div>
        <div className="nav-label">Workspace</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? "active" : ""}`} onClick={() => { setActive(label); setMenuOpen(false); }}>
              <span className="nav-icon"><Icon size={17} /></span><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="nav-label" style={{ marginTop: 22 }}>Personal</div>
        <button className={`nav-item ${active === "Settings" ? "active" : ""}`} onClick={() => { setActive("Settings"); setMenuOpen(false); }}><span className="nav-icon"><Settings size={17} /></span>Settings</button>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={17} color="#a5b4fc" />
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 10 }}>Make room for big goals</div>
            <p>Your personal command center for turning plans into progress.</p>
            <button className="outline-button" onClick={() => setActive("Goals")}>Explore goals <ArrowUpRight size={12} style={{ display: "inline", verticalAlign: "middle" }} /></button>
          </div>
          <button className="nav-item" style={{ marginTop: 14 }} onClick={() => alert("Help center will be added in a future phase.")}><span className="nav-icon"><CircleHelp size={17} /></span>Help & feedback</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={18} /></button>
            <div className="breadcrumb">Workspace <span style={{ color: "#46516a", margin: "0 8px" }}>/</span><span style={{ color: "#e2e8f0" }}>{active}</span></div>
          </div>
          <div className="top-actions">
            <div className="search-box"><Search size={14} /> <span>Search workspace</span><span style={{ marginLeft: "auto", color: "#65718a" }}>⌘ K</span></div>
            <button className="quick-add" onClick={() => setShowQuickAdd(true)}><Plus size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Quick Add</button>
            <button aria-label="Notifications" className="outline-button" onClick={() => alert("Notifications will be connected in a future phase.")} style={{ padding: 9 }}><Bell size={15} /></button>
            <button aria-label="Profile menu" className="avatar" onClick={() => alert("Account settings will be added with authentication.")}>YO</button>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">Sunday, October 18</div>
              <h1>{active === "Dashboard" ? "Your orbit, at a glance." : active}</h1>
              <div className="muted text-sm">{active === "Dashboard" ? "Small steps today. Remarkable progress over time." : `${active} workspace preview — interactive navigation foundation.`}</div>
            </div>
            <button className="outline-button" onClick={() => setActive("Goals")}><Target size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} />View goals <ChevronDown size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: 5 }} /></button>
          </div>

          <section className="stats-grid" aria-label="Workspace overview">
            {[
              { label: "Active goals", value: "03", foot: "Across your workspace", icon: Target },
              { label: "Projects in motion", value: "08", foot: "2 need attention", icon: FolderKanban },
              { label: "Tasks completed", value: "24", foot: "This is demo content", icon: Check },
              { label: "Overall progress", value: "36%", foot: "Across demo goals", icon: TrendingUp },
            ].map(({ label, value, foot, icon: Icon }) => (
              <div className="panel stat-card" key={label}>
                <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={16} /></span></div>
                <div className="stat-value">{value}</div><div className="stat-foot">{foot}</div>
              </div>
            ))}
          </section>

          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-heading"><h2>Goals in motion</h2><button className="outline-button" onClick={() => setActive("Goals")}>All goals <ArrowUpRight size={12} style={{ display: "inline", verticalAlign: "middle" }} /></button></div>
              <div className="panel-body">
                {goals.map(({ icon: Icon, title, subtitle, progress }) => (
                  <div className="goal-row" key={title}>
                    <div className="goal-badge"><Icon size={19} /></div>
                    <div className="goal-info"><div className="goal-title">{title}</div><div className="goal-meta">{subtitle}</div><div className="progress-line"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>
                    <div className="percent">{progress}%</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading"><h2>Today&apos;s focus</h2><span className="muted" style={{ fontSize: 11 }}>{tasks.filter(t => !t.done).length} remaining</span></div>
              <div className="panel-body">
                {tasks.map((task) => (
                  <div className="task-row" key={task.id}>
                    <button aria-label={task.done ? "Mark task incomplete" : "Mark task complete"} className={`task-check ${task.done ? "checked" : ""}`} onClick={() => setTasks(current => current.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}>{task.done ? <Check size={12} /> : null}</button>
                    <div style={{ flex: 1, minWidth: 0 }}><div className="task-title" style={{ textDecoration: task.done ? "line-through" : "none", color: task.done ? "#74819a" : "#e2e8f0" }}>{task.title}</div><div className="task-due">{task.due}</div></div>
                    {!task.done && <span className={`priority ${task.priority}`}>{task.priority === "high" ? "High" : "Medium"}</span>}
                  </div>
                ))}
                <button className="outline-button" style={{ width: "100%", marginTop: 10 }} onClick={() => setShowQuickAdd(true)}><Plus size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Add a task</button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading"><h2>Next milestones</h2><CalendarDays size={16} color="#8490a8" /></div>
              <div className="panel-body">
                {[
                  ["Design system approved", "Orbit · Product planning", "Oct 20"],
                  ["Project shell ready", "Orbit · Development", "Oct 23"],
                  ["First interactive roadmap", "Orbit · Core experience", "Oct 28"],
                ].map(([title, sub, date]) => <div className="milestone" key={title}><span className="milestone-dot" /><div style={{ flex: 1 }}><div className="milestone-title">{title}</div><div className="milestone-date">{sub}</div></div><span className="muted" style={{ fontSize: 10 }}>{date}</span></div>)}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading"><h2>Build Orbit</h2><span className="eyebrow" style={{ letterSpacing: 1 }}>DEV HQ</span></div>
              <div className="panel-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span className="muted text-sm">Development foundation</span><strong style={{ fontSize: 20 }}>1/5</strong></div>
                <div className="progress-line" style={{ marginTop: 13, height: 7 }}><div className="progress-fill" style={{ width: "20%" }} /></div>
                <p className="muted text-sm" style={{ lineHeight: 1.7, marginTop: 16 }}>The UI shell is the first step. Authentication, cloud saving, and full goal management come in later phases.</p>
                <button className="outline-button" onClick={() => setActive("Projects")}>Open development plan <ArrowUpRight size={12} style={{ display: "inline", verticalAlign: "middle" }} /></button>
              </div>
            </section>
          </div>
          <div className="notice"><strong style={{ color: "#cbd5e1" }}>Starter preview:</strong> dashboard cards contain illustrative sample data. Task checkboxes and Quick Add work in temporary page state; data is not saved after refresh. Authentication and database will be added in later phases.</div>
        </div>
      </main>

      {showQuickAdd && (
        <div role="dialog" aria-modal="true" aria-labelledby="quick-add-title" style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", padding: 18, background: "#020617b8" }} onMouseDown={(e) => { if (e.target === e.currentTarget) setShowQuickAdd(false); }}>
          <div className="panel" style={{ width: "min(100%, 440px)", padding: 22, boxShadow: "0 25px 90px #0008" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}><div><div className="eyebrow">QUICK CREATE</div><h2 id="quick-add-title" style={{ fontSize: 20, margin: "7px 0 0" }}>Add a task</h2></div><button className="outline-button" aria-label="Close dialog" onClick={() => setShowQuickAdd(false)}><X size={15} /></button></div>
            <label htmlFor="task-title" className="muted text-sm">Task name</label>
            <input id="task-title" autoFocus value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTask(); }} placeholder="e.g. Sketch the roadmap page" style={{ display: "block", width: "100%", margin: "8px 0 18px", padding: 12, borderRadius: 10, border: "1px solid #303b54", background: "#0b1020", color: "#f1f5f9", outline: "none" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}><button className="outline-button" onClick={() => setShowQuickAdd(false)}>Cancel</button><button className="quick-add" onClick={addTask}><Plus size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Create task</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
