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
}

export default function DiseasePage() {
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setLoading(true);
    
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/disease", { method: "POST", body: fd });
      const j = await res.json();
      setResult(j);
    } catch (err) {
      setResult({ source: "mock", error: "Connection failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 font-sans antialiased">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-emerald-950">🍃 Leaf Health Scan</h1>
        <p className="mt-2 text-sm text-zinc-600 font-medium">Full Diagnosis & Treatment Guide</p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Upload Section */}
        <div className="space-y-4">
          <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 transition">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <span className="text-sm font-bold text-emerald-700">
              {loading ? "🔬 Analyzing Image..." : "📸 Upload Leaf Photo"}
            </span>
          </label>
          {imagePreview && (
            <img src={imagePreview} className="rounded-3xl shadow-xl border-4 border-white" alt="Preview" />
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result?.plant && (
            <div className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Identified Plant</h3>
              <p className="text-xl font-bold text-zinc-900 mt-1">{result.plant.name}</p>
            </div>
          )}

          {result?.health?.diseases?.map((disease, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-zinc-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-zinc-900 p-4 flex justify-between items-center">
                <h4 className="text-white font-bold">{disease.name}</h4>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded font-black">
                  {(disease.probability * 100).toFixed(0)}% MATCH
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  disease.severity === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                }`}>
                  {disease.severity} Severity Risk
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <h5 className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-wider">Expert Details & Care</h5>
                  {/* whitespace-pre-line is vital to show the line breaks from the API */}
                  <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line font-medium">
                    {disease.treatment}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {!result && !loading && (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-3xl p-10 text-zinc-400 italic text-sm">
              Upload a leaf photo to generate a health report.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}