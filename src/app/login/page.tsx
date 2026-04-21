"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-950">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-600">Sign in to manage orders, AR sessions, and care plans.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="text-zinc-600">Email</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600">Password</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600">
        New here?{" "}
        <Link href="/register" className="font-medium text-emerald-700 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="text-center text-xs text-zinc-500">
        Admin access can be created from the register page using the admin secret configured by your deployment.
      </p>
    </main>
  );
}
