"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddToCartButton({ plantId }: { plantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId, quantity: 1 }),
      });
      if (res.ok) router.push("/cart");
      else {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Could not add to cart");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={loading}
      className="rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
    >
      {loading ? "Adding…" : "Add to cart"}
    </button>
  );
}
