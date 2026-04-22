"use client";

import { useState } from "react";

interface DiseaseResult {
  source: "plant.id-live" | "mock";
  plant?: { name: string; probability: number; similar_images: number };
  health?: {
    status: string;
    diseases: Array<{ name: string; probability: number; treatment: string; severity: string }>;
  };
  error?: string;
}

export default function DiseasePage() {
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/disease", { method: "POST", body: fd });
      const j = await res.json();
      setResult(j);
    } catch (err) {
      setResult({ source: "mock", error: "Upload failed" });
    } finally {
      setLoading(false);
      e.target.value = ""; // Allows re-uploading the same file
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-emerald-950 tracking-tight">🍃 Leaf Health Scan</h1>
      
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Upload Area */}
        <div>
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center hover:bg-emerald-100/50 transition">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <div className="h-12 w-12 text-emerald-600 mb-2">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm font-medium text-emerald-900">{loading ? "Analyzing..." : "Click to upload a leaf image"}</p>
          </label>
          {imagePreview && <img src={imagePreview} className="mt-4 rounded-lg border border-emerald-200 w-full" alt="Preview" />}
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          {result?.error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-sm">{result.error}</div>}

          {result && !result.error && (
            <>
              {result.plant && (
                <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Identified Plant</p>
                  <p className="text-lg font-semibold text-emerald-950">{result.plant.name}</p>
                </div>
              )}

              {result.health && (
                <div className={`p-4 border rounded-xl shadow-sm ${result.health.status === "Healthy" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
                  <p className="text-[10px] font-bold uppercase opacity-70">Status</p>
                  <p className="text-lg font-semibold">{result.health.status}</p>
                </div>
              )}

              {result.health?.diseases.map((disease, idx) => (
                <div key={idx} className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-zinc-900">{disease.name}</p>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${disease.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {disease.severity}
                    </span>
                  </div>

                  {/* UI logic to show the treatment guide */}
                  <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Treatment Guide</p>
                    <p className="text-sm text-zinc-700 leading-relaxed">{disease.treatment}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}