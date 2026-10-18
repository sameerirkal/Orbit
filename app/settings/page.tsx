
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, UserRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data, error: authError } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "Email unavailable");
      setUserId(data.user.id);
      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setSigningOut(false);
      return;
    }

    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <header className="mb-8">
          <p className="mb-2 text-sm text-cyan-400">ORBIT WORKSPACE</p>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-slate-400">
            Manage your account and sign-in session.
          </p>
        </header>

        {loading ? (
          <p className="text-slate-400">Loading account details...</p>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-5 flex items-center gap-3">
                <UserRound className="text-cyan-400" size={22} />
                <h2 className="text-lg font-semibold">Account Profile</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-slate-400">Email</p>
                  <p className="break-all">{email}</p>
                </div>

                <div>
                  <p className="mb-1 text-sm text-slate-400">User ID</p>
                  <p className="break-all font-mono text-sm">{userId}</p>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="text-cyan-400" size={22} />
                <h2 className="text-lg font-semibold">Account Security</h2>
              </div>

              <p className="text-sm text-slate-400">
                Your account uses Supabase authentication. Your data access
                should remain protected by the database&apos;s Row Level
                Security policies.
              </p>
            </section>

            {error && (
              <p role="alert" className="mt-5 text-sm text-red-300">
                {error}
              </p>
            )}

            <section className="mt-5 rounded-2xl border border-red-900/60 bg-slate-900 p-6">
              <h2 className="mb-2 text-lg font-semibold">Sign Out</h2>
              <p className="mb-4 text-sm text-slate-400">
                Sign out of your Orbit account on this session.
              </p>

              <button
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                <LogOut size={16} />
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
