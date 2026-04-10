"use client";

import { LocationMap } from "@/components/LocationMap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Rec = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrls: string[];
  score: number;
  label: string;
};

export default function RecommendationsPage() {
  const [lat, setLat] = useState(23.8103);
  const [lng, setLng] = useState(90.4125);
  const [indoor, setIndoor] = useState(false);
  const [lowMaintenance, setLowMaintenance] = useState(false);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude);
        setLng(p.coords.longitude);
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  async function run() {
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    if (indoor) params.set("indoor", "1");
    if (lowMaintenance) params.set("lowMaintenance", "1");
    const res = await fetch(`/api/recommendations?${params.toString()}`);
    const j = await res.json();
    if (res.ok) setRecs(j.recommendations ?? []);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Smart recommendations</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600">
        Scores blend Open-Meteo cloud cover, sun position heuristics, and your toggles. Tune
        weights in `src/app/api/recommendations/route.ts`.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <LocationMap lat={lat} lng={lng} onLocationChange={(la, ln) => { setLat(la); setLng(ln); }} />
          <label className="mt-4 flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={indoor} onChange={(e) => setIndoor(e.target.checked)} />
            Prefer indoor categories
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={lowMaintenance}
              onChange={(e) => setLowMaintenance(e.target.checked)}
            />
            Prefer low maintenance (wider watering intervals)
          </label>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="mt-4 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Scoring…" : "Refresh recommendations"}
          </button>
        </div>
        <div className="space-y-4">
          {recs.map((r) => (
            <Link
              key={r.id}
              href={`/plants/${r.id}`}
              className="flex gap-3 rounded-xl border border-emerald-100 bg-white p-3 shadow-sm hover:border-emerald-200"
            >
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-emerald-50">
                {r.imageUrls[0] ? (
                  <Image src={r.imageUrls[0]} alt="" fill className="object-cover" sizes="96px" />
                ) : null}
              </div>
              <div>
                <p className="font-medium text-emerald-950">{r.name}</p>
                <p className="text-xs text-zinc-500">{r.category}</p>
                <p className="mt-1 text-sm text-zinc-700">
                  Score {r.score} · {r.label}
                </p>
                <p className="text-sm font-semibold text-emerald-800">${r.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
          {recs.length === 0 ? (
            <p className="text-sm text-zinc-500">Run refresh after loading plants from seed.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
