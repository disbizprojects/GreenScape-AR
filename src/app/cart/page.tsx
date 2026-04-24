"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Item = {
  plantId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrls: string[];
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Shipping Address State
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Bangladesh");

  async function load() {
    const res = await fetch("/api/cart");
    const j = await res.json();
    if (res.ok) setItems(j.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // --- UPDATED CHECKOUT FUNCTION ---
  async function checkout() {
    if (!line1 || !city || !postalCode) {
      alert("Please fill shipping address fields.");
      return;
    }
    
    setCheckoutLoading(true);
    
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "69e91b81b08ad2a833c86c28", // Your actual MongoDB User ID
          paymentMethod: "Mock bKash",
          totalAmount: subtotal,             // Uses the actual cart total
          items: items,                      // Uses the actual items array from state
          shippingAddress: `${line1}, ${city}, ${postalCode}, ${country}` // Combines address into a single string
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        alert("Payment Successful! Check your email for the receipt.");
        // Redirect the user to their dashboard or order history
        router.push("/dashboard"); 
      } else {
        alert(data.error || "Checkout failed.");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Network error. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }
  // ----------------------------------

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-500">Loading cart…</main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Your cart</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-zinc-600">
          Cart is empty.{" "}
          <Link href="/plants" className="text-emerald-700 hover:underline">
            Browse plants
          </Link>
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((i) => (
            <div
              key={i.plantId}
              className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white p-4"
            >
              <div>
                <p className="font-medium text-emerald-950">{i.name}</p>
                <p className="text-sm text-zinc-600">
                  ৳{i.price.toFixed(2)} × {i.quantity}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={async () => {
                  await fetch(`/api/cart?plantId=${i.plantId}`, { method: "DELETE" });
                  load();
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <p className="text-right text-lg font-semibold text-emerald-900">
            Subtotal: ৳{subtotal.toFixed(2)}
          </p>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-emerald-950">Shipping address</h2>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Address line"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <input
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="Postal code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={checkoutLoading}
              className="mt-6 w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {checkoutLoading ? "Processing Payment…" : "Pay with bKash (Mock)"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
