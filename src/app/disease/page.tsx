"use client";

import { useState } from "react";

interface DiseaseResult {
  source: "plant.id-live" | "mock";
  plant?: { name: string; probability: number; similar_images: number };
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

    // Clean preview generation
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setLoading(true);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/disease", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Server responded with an error");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ source: "mock", error: "Failed to connect to the server." });
    } finally {
      setLoading(false);
      e.target.value = ""; // Clear input for re-uploads
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-950 flex items-center gap-2">
          🍃 Leaf Health Scan
        </h1>
        <p className="text-zinc-500 mt-1">Instant AI plant identification and disease diagnosis.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Input Side */}
        <div className="space-y-4">
          <label className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-10 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <div className="rounded-full bg-emerald-100 p-4 text-emerald-600 group-hover:scale-110 transition-transform">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-emerald-900">
              {loading ? "Analyzing Leaf..." : "Upload Plant Photo"}
            </p>
          </label>

          {imagePreview && (
            <div className="overflow-hidden rounded-2xl border border-emerald-100 shadow-sm">
              <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover" />
            </div>
          )}
        </div>

        {/* Results Side */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="h-full flex items-center justify-center text-zinc-400 italic border border-dashed rounded-2xl p-10">
              Upload an image to see results...
            </div>
          )}

          {result?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              <strong>Error:</strong> {result.error}
            </div>
          )}

          {result && !result.error && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Plant Identity */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm mb-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Identity</span>
                <h2 className="text-xl font-bold text-zinc-900">{result.plant?.name}</h2>
                <p className="text-xs text-zinc-500 mt-1">Accuracy: {(result.plant!.probability * 100).toFixed(1)}%</p>
              </div>

              {/* Overall Health Status */}
              <div className={`p-5 rounded-2xl border mb-4 shadow-sm ${
                result.health?.status === "Healthy" ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"
              }`}>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Health Condition</span>
                <p className={`text-lg font-bold mt-1 ${
                  result.health?.status === "Healthy" ? "text-green-800" : "text-orange-800"
                }`}>
                  {result.health?.status}
                </p>
              </div>

              {/* Disease Details */}
              <div className="space-y-4">
                {result.health?.diseases.map((d, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-zinc-900">{d.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        d.severity === "High" ? "bg-red-100 text-red-700" : 
                        d.severity === "Moderate" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {d.severity}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Treatment Tips</p>
                        <p className="text-sm text-zinc-700 mt-1 leading-relaxed">{d.treatment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.note && (
                <p className="text-[10px] text-zinc-400 mt-6 text-center italic">{result.note}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}