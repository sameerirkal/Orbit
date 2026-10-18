"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth(signUp: boolean) {
    setLoading(true);
    setMessage("");

    const result = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (signUp && !result.data.session) {
      setMessage("Account created! Check your email to confirm your account.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main style={{ maxWidth: 400, margin: "80px auto", padding: 24, color: "#fff" }}>
      <h1>Orbit Login</h1>
      <p>Sign in or create your account.</p>

      <form onSubmit={(e) => { e.preventDefault(); void handleAuth(false); }}>
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 16px" }}
        />

        <label>Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 16px" }}
        />

        <button disabled={loading} type="submit">
          {loading ? "Please wait..." : "Sign in"}
        </button>

        <button
          disabled={loading}
          type="button"
          onClick={() => void handleAuth(true)}
          style={{ marginLeft: 12 }}
        >
          Create account
        </button>
      </form>

      <p role="status">{message}</p>
    </main>
  );
}