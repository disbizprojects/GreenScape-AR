"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [becomeVendor, setBecomeVendor] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [becomeAdmin, setBecomeAdmin] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        becomeVendor,
        businessName: becomeVendor ? businessName : undefined,
        becomeAdmin,
        adminSecret: becomeAdmin ? adminSecret : undefined,
      }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(j.error ?? "Registration failed");
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-950">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-600">Customers, nursery vendors, and admins can register here.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="text-zinc-600">Name</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
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
          <span className="text-zinc-600">Password (min 8 chars)</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={becomeVendor}
            onChange={(e) => {
              const checked = e.target.checked;
              setBecomeVendor(checked);
              if (checked) {
                setBecomeAdmin(false);
                setAdminSecret("");
              }
            }}
          />
          I want to sell plants (nursery vendor)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={becomeAdmin}
            onChange={(e) => {
              const checked = e.target.checked;
              setBecomeAdmin(checked);
              if (checked) {
                setBecomeVendor(false);
                setBusinessName("");
              }
            }}
          />
          I want to register as admin
        </label>
        {becomeVendor ? (
          <label className="block text-sm">
            <span className="text-zinc-600">Business name</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required={becomeVendor}
            />
          </label>
        ) : null}
        {becomeAdmin ? (
          <label className="block text-sm">
            <span className="text-zinc-600">Admin secret</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              required={becomeAdmin}
              autoComplete="off"
            />
          </label>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
