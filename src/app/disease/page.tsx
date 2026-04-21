"use client";

import { useState } from "react";

interface DiseaseResult {
  source: "plant.id-live" | "mock";
  plant?: {
    name: string;
    probability: number;
    similar_images: number;
  };
  health?: {
    status: string;
    diseases: Array<{
      name: string;
      probability: number;
      treatment: string;
      severity: string;
    }>;
  };
  error?: string;
  note?: string;
}

export default function DiseasePage() {
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use URL.createObjectURL for better performance with large images
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    setLoading(true);
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/disease", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to analyze image");
      const j = await res.json();
      setResult(j);
    } catch (err) {
      setResult({
        source: "mock",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setLoading(false);
      e.target.value = ""; // Reset input so same file can be uploaded again
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-emerald-950">🍃 Leaf Health Scan</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Upload a clear photo of a leaf to detect diseases and health issues.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Upload Area */}
        <div>
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center hover:bg-emerald-100/50 transition">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <svg className="h-12 w-12 text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-emerald-900">
              {loading ? "Analyzing image..." : "Click to upload a leaf image"}
            </p>
          </label>

          {imagePreview && (
            <div className="mt-4 rounded-lg overflow-hidden border border-emerald-200">
              <img src={imagePreview} alt="Preview" className="w-full h-auto" />
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          {result?.error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{result.error}</p>
            </div>
          )}

          {result && !result.error && (
            <>
              {result.plant && (
                <div className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-emerald-700 uppercase">Identified Plant</p>
                  <p className="text-lg font-semibold text-emerald-950 mt-1">{result.plant.name}</p>
                </div>
              )}

              {result.health && (
                <div className={`rounded-xl border p-4 shadow-sm ${
                  result.health.status === "Healthy" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}>
                  <p className={`text-xs font-semibold uppercase ${result.health.status === "Healthy" ? "text-green-700" : "text-yellow-700"}`}>
                    Health Status
                  </p>
                  <p className={`text-lg font-semibold mt-1 ${result.health.status === "Healthy" ? "text-green-950" : "text-yellow-950"}`}>
                    {result.health.status}
                  </p>
                </div>
              )}

              {result.health?.diseases?.map((disease, idx) => (
                <div key={idx} className={`rounded-lg p-4 border ${
                  disease.severity === "High" ? "bg-red-50 border-red-200" : 
                  disease.severity === "Moderate" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-zinc-900">{disease.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/50 border border-black/5 font-bold uppercase">
                      {disease.severity}
                    </span>
                  </div>
                  
                  {/* Treatment Tips from Plant.id */}
                  <div className="mt-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Suggested Treatment</p>
                    <p className="text-sm text-zinc-700 mt-1 leading-relaxed">
                      {disease.treatment}
                    </p>
                  </div>
                </div>
              ))}

              <p className="text-xs text-zinc-400 text-center">
                Source: {result.source === "plant.id-live" ? "Plant.id Live API" : "Development Mock Data"}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}