"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/analytics");
      const j = await res.json();
      if (res.ok) setData(j);
    })();
  }, []);

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-zinc-500">Loading…</main>
    );
  }

  const role = data.role as string;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Gardening analytics</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Impact estimates are illustrative — tune coefficients with your agronomy data.
      </p>

      {role === "CUSTOMER" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Plants purchased</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.plantsPurchased ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Est. CO₂ offset (kg/yr)</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.estimatedCo2KgPerYear ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Water estimate (L/yr)</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.waterLitersEstimateYear ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Active care plans</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.carePlans ?? 0)}
            </p>
          </div>
          <div className="sm:col-span-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-sm text-zinc-700">
            {String(data.survivalHint ?? "")}
          </div>
        </div>
      ) : null}

      {role === "VENDOR" ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Units sold (your plants)</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-900">
              {String(data.totalUnitsSold ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="font-semibold text-emerald-950">Top listings</p>
            <ul className="mt-2 text-sm text-zinc-700">
              {(data.topPlants as { name: string; sold: number }[] | undefined)?.map((r) => (
                <li key={r.name} className="flex justify-between border-b border-emerald-50 py-1">
                  <span>{r.name}</span>
                  <span>{r.sold} sold</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {role === "ADMIN" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Users</p>
            <p className="mt-1 text-3xl font-semibold">{String(data.users ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Active plants</p>
            <p className="mt-1 text-3xl font-semibold">{String(data.activePlants ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Paid orders</p>
            <p className="mt-1 text-3xl font-semibold">{String(data.paidOrders ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Revenue (recorded)</p>
            <p className="mt-1 text-3xl font-semibold">${String(data.revenue ?? 0)}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
        <Link 
          href="/dashboard/watering-schedule" 
          className="rounded-md bg-blue-100 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-200 flex items-center gap-2 shadow-sm"
        >
           Smart Watering Schedule
        </Link>
        <Link href="/orders" className="text-emerald-700 hover:underline px-2">
          Orders
        </Link>
        <Link href="/profile" className="text-emerald-700 hover:underline px-2">
          Profile & addresses
        </Link>
        <Link href="/plants" className="text-emerald-700 hover:underline px-2">
          Browse plants
        </Link>
      </div>
    </main>
  );
}