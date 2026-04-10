"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  _id: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/orders");
      const j = await res.json();
      if (res.ok) setOrders(j);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">Loading…</main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Orders</h1>
      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <Link
            key={o._id}
            href={`/orders/${o._id}`}
            className="block rounded-xl border border-emerald-100 bg-white p-4 shadow-sm hover:border-emerald-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-950">#{o._id.slice(-6)}</span>
              <span className="text-sm text-zinc-500">
                {new Date(o.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {o.status} · {o.paymentStatus} · ${o.total.toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <p className="mt-6 text-zinc-600">No orders yet.</p>
      ) : null}
    </main>
  );
}
