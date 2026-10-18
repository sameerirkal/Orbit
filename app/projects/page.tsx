  "use client";

  import { useEffect, useState, FormEvent } from "react";
  import { useRouter } from "next/navigation";
  import { supabase } from "@/lib/supabase";

  type ProjectStatus = "Planning" | "In Progress" | "Completed";

  type Project = {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    progress: number;
    start_date: string | null;
    due_date: string | null;
    created_at: string;
  };

  const emptyForm = {
    name: "",
    description: "",
    status: "Planning" as ProjectStatus,
    progress: 0,
    start_date: "",
    due_date: "",
  };

  export default function ProjectsPage() {
    const router = useRouter();

    const [projects, setProjects] = useState<Project[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
      async function initialize() {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setUserId(data.user.id);
        await loadProjects(data.user.id);
      }

      initialize();
    }, [router]);

    async function loadProjects(uid: string) {
      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Projects load nahi hue: " + error.message);
      } else {
        setProjects((data ?? []) as Project[]);
      }

      setLoading(false);
    }

    function updateField(
      field: keyof typeof emptyForm,
      value: string | number
    ) {
      setForm((previous) => ({ ...previous, [field]: value }));
    }

    function resetForm() {
      setForm({ ...emptyForm });
      setEditingId(null);
    }

    function editProject(project: Project) {
      setForm({
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        progress: project.progress,
        start_date: project.start_date ?? "",
        due_date: project.due_date ?? "",
      });

      setEditingId(project.id);
      setMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();

      if (!userId) {
        setMessage("Please login first.");
        return;
      }

      if (!form.name.trim()) {
        setMessage("Project ka naam enter karo.");
        return;
      }

      if (
        form.start_date &&
        form.due_date &&
        form.due_date < form.start_date
      ) {
        setMessage("Due date, start date se pehle nahi ho sakti.");
        return;
      }

      setSaving(true);
      setMessage("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        progress:
          form.status === "Completed"
            ? 100
            : Math.max(0, Math.min(100, Number(form.progress))),
        start_date: form.start_date || null,
        due_date: form.due_date || null,
      };

      const result = editingId
        ? await supabase
            .from("projects")
            .update(payload)
            .eq("id", editingId)
            .eq("user_id", userId)
            .select()
        : await supabase
            .from("projects")
            .insert({ ...payload, user_id: userId })
            .select();

      if (result.error) {
        setMessage("Save nahi hua: " + result.error.message);
      } else {
        setMessage(editingId ? "Project updated!" : "Project created!");
        resetForm();
        await loadProjects(userId);
      }

      setSaving(false);
    }

    async function deleteProject(project: Project) {
      const confirmed = window.confirm(
        `"${project.name}" Do you want to delete ?`
      );

      if (!confirmed || !userId) return;

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id)
        .eq("user_id", userId);

      if (error) {
        setMessage("Not deleted: " + error.message);
        return;
      }

      setProjects((previous) =>
        previous.filter((item) => item.id !== project.id)
      );

      if (editingId === project.id) resetForm();

      setMessage("Project deleted.");
    }

    const filteredProjects = projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        (project.description ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    const completedCount = projects.filter(
      (project) => project.status === "Completed"
    ).length;

    const activeCount = projects.filter(
      (project) => project.status === "In Progress"
    ).length;

    const averageProgress = projects.length
      ? Math.round(
          projects.reduce((sum, project) => sum + project.progress, 0) /
            projects.length
        )
      : 0;

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                onClick={() => router.push("/")}
                className="mb-3 text-sm text-violet-300 hover:text-violet-200"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Projects
              </h1>

              <p className="mt-2 text-slate-400">
                Plan your work. Track your progress. Finish what matters.
              </p>
            </div>

            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
              Orbit Workspace
            </span>
          </header>

          <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total Projects", value: projects.length },
              { label: "In Progress", value: activeCount },
              { label: "Completed", value: completedCount },
              { label: "Average Progress", value: `${averageProgress}%` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </section>

          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <h2 className="mb-5 text-xl font-semibold">
              {editingId ? "Edit Project" : "Create a Project"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Project Name *
                  </label>
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="e.g. Launch my YouTube channel"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) => {
                      const status = event.target.value as ProjectStatus;
                      setForm((previous) => ({
                        ...previous,
                        status,
                        progress:
                          status === "Completed" ? 100 : previous.progress,
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
                  >
                    <option>Planning</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="What do you want to achieve?"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Progress: {form.status === "Completed" ? 100 : form.progress}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    disabled={form.status === "Completed"}
                    value={form.status === "Completed" ? 100 : form.progress}
                    onChange={(event) =>
                      updateField("progress", Number(event.target.value))
                    }
                    className="mt-3 w-full accent-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      updateField("start_date", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      updateField("due_date", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-violet-600 px-6 py-3 font-medium transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Project"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-700 px-6 py-3 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {message && (
              <p
                role="status"
                className="mt-4 break-words text-sm text-violet-300"
              >
                {message}
              </p>
            )}
          </section>

          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-violet-500"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-violet-500"
              >
                <option value="All">All Statuses</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                Loading projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center">
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Create your first project using the form above.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredProjects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-semibold">
                          {project.name}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-400">
                          {project.description || "No description added."}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                          project.status === "Completed"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : project.status === "In Progress"
                              ? "bg-blue-500/15 text-blue-300"
                              : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span>{project.progress}%</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{
                            width: `${Math.max(0, Math.min(100, project.progress))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                      {project.start_date && (
                        <span>Start: {project.start_date}</span>
                      )}
                      {project.due_date && (
                        <span>Due: {project.due_date}</span>
                      )}
                    </div>

                    <div className="mt-6 flex gap-3 border-t border-slate-800 pt-4">
                      <button
                        onClick={() => editProject(project)}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteProject(project)}
                        className="rounded-lg border border-red-900/60 px-4 py-2 text-sm text-red-300 hover:bg-red-950/50"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    );
                  }
