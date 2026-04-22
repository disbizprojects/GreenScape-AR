"use client";

import { useEffect, useState } from "react";

type Vendor = {
  _id: string;
  name: string;
  email: string;
  vendorProfile?: { verified: boolean; businessName: string };
};

type Order = {
  _id: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: { title: string; quantity: number; unitPrice: number }[];
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  ORDER_CONFIRMED: "Confirmed",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function AdminPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  async function load() {
    const [vendorsRes, ordersRes] = await Promise.all([fetch("/api/admin/vendors"), fetch("/api/orders")]);
    const vendorsJson = await vendorsRes.json().catch(() => []);
    const ordersJson = await ordersRes.json().catch(() => []);
    if (vendorsRes.ok) setVendors(vendorsJson);
    if (ordersRes.ok) setOrders(ordersJson);
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

  async function updateOrder(id: string, status: "DELIVERED") {
    setUpdatingOrderId(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: "Delivered successfully by admin." }),
    });
    setUpdatingOrderId(null);
    if (res.ok) {
      load();
      return;
    }
    const j = await res.json().catch(() => ({}));
    alert(j.error ?? "Could not update order");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Admin panel</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Approve nurseries, then confirm the final order delivery once the vendor hands the package over.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-emerald-950">Order delivery control</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Mark a paid order as delivered after the delivery handoff is complete.
        </p>
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li
              key={order._id}
              className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-emerald-950">Order #{order._id.slice(-8)}</p>
                  <p className="text-sm text-zinc-600">
                    {statusLabels[order.status] ?? order.status} · {order.paymentStatus}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"} · Created on {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-emerald-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">Paid orders can be closed here</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
                {order.items.map((item) => (
                  <span key={item.title} className="rounded-full bg-emerald-50 px-3 py-1">
                    {item.title} × {item.quantity}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.paymentStatus === "PAID" && order.status === "OUT_FOR_DELIVERY" ? (
                  <button
                    type="button"
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    disabled={updatingOrderId === order._id}
                    onClick={() => updateOrder(order._id, "DELIVERED")}
                  >
                    {updatingOrderId === order._id ? "Updating…" : "Mark done / delivered"}
                  </button>
                ) : (
                  <p className="text-xs text-zinc-500">
                    {order.paymentStatus !== "PAID"
                      ? "Waiting for payment before delivery can be confirmed."
                      : order.status === "DELIVERED"
                        ? "Delivery already confirmed."
                        : "Awaiting vendor handoff before final delivery confirmation."}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-emerald-950">Vendor verification</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Approve nurseries before they appear as trusted sellers in future UI surfaces.
        </p>
        <ul className="mt-4 space-y-3">
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
      </section>
    </main>
  );
}
