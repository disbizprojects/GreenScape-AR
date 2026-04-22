"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Order = {
  _id: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: { title: string; quantity: number; unitPrice: number }[];
  tracking: { status: string; at: string; note?: string }[];
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/orders/${id}`);
      const j = await res.json();
      if (res.ok) setOrder(j);
    })();
  }, [id]);

  async function completeMockPayment() {
    setMarkingPaid(true);
    const res = await fetch(`/api/orders/${id}/mock-pay`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setMarkingPaid(false);

    if (!res.ok) {
      alert(j.error ?? "Could not complete mock payment");
      return;
    }

    setOrder(j as Order);
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">Loading…</main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Order #{order._id.slice(-8)}</h1>
      <p className="mt-1 text-sm text-zinc-600">
        {order.status} · {order.paymentStatus}
      </p>

      <ul className="mt-6 space-y-2">
        {order.items.map((i) => (
          <li key={i.title} className="flex justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
            <span>
              {i.title} × {i.quantity}
            </span>
            <span>${(i.unitPrice * i.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-right font-semibold text-emerald-900">
        Total: ${order.total.toFixed(2)}
      </p>

      {order.paymentStatus === "UNPAID" ? (
        <button
          type="button"
          onClick={completeMockPayment}
          disabled={markingPaid}
          className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {markingPaid ? "Completing…" : "Mock payment done"}
        </button>
      ) : null}

      <div className="mt-10">
        <h2 className="font-semibold text-emerald-950">Tracking timeline</h2>
        <ol className="mt-3 space-y-2 text-sm text-zinc-700">
          {order.tracking.map((t) => (
            <li key={t.at + t.status}>
              <span className="font-medium">{t.status}</span> —{" "}
              {new Date(t.at).toLocaleString()} {t.note ? `· ${t.note}` : ""}
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-10 text-center">
        <Link href="/orders" className="text-emerald-700 hover:underline">
          All orders
        </Link>
      </p>
    </main>
  );
}
