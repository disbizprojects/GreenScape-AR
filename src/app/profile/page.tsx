"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState<
    { label: string; line1: string; city: string; postalCode: string; country: string }[]
  >([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/user/me");
      const u = await res.json();
      if (res.ok) {
        setName(u.name ?? "");
        setAddresses(u.addresses?.length ? u.addresses : [{ label: "Home", line1: "", city: "", postalCode: "", country: "" }]);
      }
    })();
  }, []);

  async function save() {
    setMsg(null);
    const res = await fetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, addresses }),
    });
    if (res.ok) setMsg("Saved.");
    else setMsg("Could not save.");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Profile</h1>
      <label className="mt-6 block text-sm">
        Display name
        <input
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <h2 className="mt-8 text-sm font-semibold text-emerald-900">Delivery addresses</h2>
      {addresses.map((a, i) => (
        <div key={i} className="mt-3 space-y-2 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <input
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Label"
            value={a.label}
            onChange={(e) => {
              const next = [...addresses];
              next[i] = { ...a, label: e.target.value };
              setAddresses(next);
            }}
          />
          <input
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Line 1"
            value={a.line1}
            onChange={(e) => {
              const next = [...addresses];
              next[i] = { ...a, line1: e.target.value };
              setAddresses(next);
            }}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="City"
              value={a.city}
              onChange={(e) => {
                const next = [...addresses];
                next[i] = { ...a, city: e.target.value };
                setAddresses(next);
              }}
            />
            <input
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Postal"
              value={a.postalCode}
              onChange={(e) => {
                const next = [...addresses];
                next[i] = { ...a, postalCode: e.target.value };
                setAddresses(next);
              }}
            />
          </div>
          <input
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Country"
            value={a.country}
            onChange={(e) => {
              const next = [...addresses];
              next[i] = { ...a, country: e.target.value };
              setAddresses(next);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={save}
        className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Save profile
      </button>
      {msg ? <p className="mt-3 text-sm text-emerald-800">{msg}</p> : null}
    </main>
  );
}
