"use client";

import { useEffect, useState } from "react";

type Vendor = {
  _id: string;
  name: string;
  email: string;
  vendorProfile?: { verified: boolean; businessName: string };
};

export default function AdminPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  async function load() {
    const res = await fetch("/api/admin/vendors");
    const j = await res.json();
    if (res.ok) setVendors(j);
  }

  useEffect(() => {
    load();
  }, []);

  async function verify(id: string, verified: boolean) {
    const res = await fetch("/api/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, verified }),
    });
    if (res.ok) load();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Vendor verification</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Approve nurseries before they appear as trusted sellers in future UI surfaces.
      </p>
      <ul className="mt-8 space-y-3">
        {vendors.map((v) => (
          <li
            key={v._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-medium text-emerald-950">{v.vendorProfile?.businessName ?? v.name}</p>
              <p className="text-sm text-zinc-600">{v.email}</p>
              <p className="text-xs text-zinc-500">
                Status: {v.vendorProfile?.verified ? "Verified" : "Pending"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white"
                onClick={() => verify(v._id, true)}
              >
                Verify
              </button>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-700"
                onClick={() => verify(v._id, false)}
              >
                Revoke
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
