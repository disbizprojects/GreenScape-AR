"use client";

import { useState } from "react";

export default function DiseasePage() {
  const [result, setResult] = useState<any>(null);
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
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 font-sans text-zinc-900">
      <h1 className="text-2xl font-bold border-b pb-4 mb-8">Leaf Health Assessment</h1>
      
      <div className="grid gap-10 md:grid-cols-2">
        {/* Left Column: Upload */}
        <div className="space-y-4">
          <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <span className="text-sm font-medium text-zinc-600">
              {loading ? "Processing..." : "Upload image for diagnosis"}
            </span>
          </label>
          {imagePreview && <img src={imagePreview} className="rounded-xl shadow-md" alt="Preview" />}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {result?.health?.diseases?.map((disease: any, idx: number) => (
            <div key={idx} className="border-b pb-6 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{disease.name}</h3>
                <span className="text-sm font-mono font-bold text-zinc-400">
                  {(disease.probability * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex gap-2 mb-4">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                  disease.severity === 'High' ? 'border-red-200 bg-red-50 text-red-600' : 'border-orange-200 bg-orange-50 text-orange-600'
                }`}>
                  {disease.severity} Severity
                </span>
              </div>

              {/* TREATMENT CONTENT */}
              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                <div className="flex items-center gap-2 mb-2 text-emerald-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider">Treatment & Details</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {disease.treatment}
                </p>
              </div>
            </div>
          ))}

          {!result && !loading && (
            <p className="text-zinc-400 italic">Upload a photo to see Cercospora or Bacterial details here.</p>
          )}
        </div>
      </div>
    </main>
  );
}