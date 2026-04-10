"use client";

import { LocationMap } from "@/components/LocationMap";
import { ModelViewerPlant } from "@/components/ModelViewerPlant";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Plant = {
  _id: string;
  name: string;
  modelUrl: string;
  sunlightRequirement: string;
  growthScalePerYear: number;
};

type Analysis = {
  weather: {
    temperatureC: number;
    relativeHumidityPct: number;
    precipitationMm: number;
    cloudCoverPct: number;
  };
  sunlight: {
    compatibilityScore: number;
    label: string;
    summary: string;
  };
  survival: { survivalPct: number; factors: string[] };
  watering: {
    nextSuggestedWater: string;
    adjustedForRain: boolean;
    notes: string[];
  };
};

export function ArClient({ plant }: { plant: Plant }) {
  const [lat, setLat] = useState(23.8103);
  const [lng, setLng] = useState(90.4125);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [growthMonths, setGrowthMonths] = useState(6);

  const growthScale = useMemo(() => {
    const years = growthMonths / 12;
    return 1 + plant.growthScalePerYear * years;
  }, [growthMonths, plant.growthScalePerYear]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId: plant._id, lat, lng }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Analysis failed");
      setAnalysis(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [lat, lng, plant._id]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-emerald-800">AR workspace</p>
        <h1 className="text-3xl font-semibold text-emerald-950">{plant.name}</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Use the 3D view below, then launch AR on a supported phone. Growth preview scales the
          glTF model to approximate future size — swap in production plant models for accuracy.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <ModelViewerPlant
          src={plant.modelUrl}
          alt={plant.name}
          growthScale={growthScale}
        />
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex flex-1 items-center gap-3 text-sm text-zinc-700">
            Growth preview (months)
            <input
              type="range"
              min={1}
              max={36}
              value={growthMonths}
              onChange={(e) => setGrowthMonths(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 tabular-nums">{growthMonths} mo</span>
          </label>
          <p className="text-xs text-zinc-500">
            Scale factor ≈ {growthScale.toFixed(2)}× · educational simulation
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-emerald-950">Location (OpenStreetMap)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Tap the map to move the pin — we use these coordinates for sun + weather heuristics.
          </p>
          <div className="mt-3">
            <LocationMap lat={lat} lng={lng} onLocationChange={(la, ln) => { setLat(la); setLng(ln); }} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-emerald-950">Environmental analysis</h2>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Running…" : "Run sunlight & survival analysis"}
          </button>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          {analysis ? (
            <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm">
              <div>
                <p className="font-semibold text-emerald-900">Now (Open-Meteo)</p>
                <p className="text-zinc-700">
                  {analysis.weather.temperatureC.toFixed(1)}°C ·{" "}
                  {analysis.weather.relativeHumidityPct}% RH · rain{" "}
                  {analysis.weather.precipitationMm} mm · clouds{" "}
                  {analysis.weather.cloudCoverPct}%
                </p>
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Sunlight match</p>
                <p className="text-zinc-700">
                  {analysis.sunlight.label} ({analysis.sunlight.compatibilityScore}/100)
                </p>
                <p className="text-zinc-600">{analysis.sunlight.summary}</p>
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Survival estimate</p>
                <p className="text-zinc-700">{analysis.survival.survivalPct}%</p>
                <ul className="list-disc pl-5 text-zinc-600">
                  {analysis.survival.factors.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Watering</p>
                <p className="text-zinc-700">
                  Next suggested: {new Date(analysis.watering.nextSuggestedWater).toLocaleString()}
                  {analysis.watering.adjustedForRain ? " (rain-adjusted)" : ""}
                </p>
                <ul className="list-disc pl-5 text-zinc-600">
                  {analysis.watering.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-center text-sm text-zinc-500">
        <Link href={`/plants/${plant._id}`} className="text-emerald-700 hover:underline">
          Back to plant details
        </Link>
      </p>
    </div>
  );
}
