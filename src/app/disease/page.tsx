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
      setResult({ error: "Connection failed" });
    } finally {
      setLoading(false);
      e.target.value = ""; 
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 font-sans">
      <h1 className="text-3xl font-bold text-emerald-950">🍃 Leaf Health Scan</h1>
      
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center hover:bg-emerald-100/50 transition">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <p className="text-sm font-medium text-emerald-900">{loading ? "Analyzing..." : "Upload Leaf Photo"}</p>
          </label>
          {imagePreview && <img src={imagePreview} className="mt-4 rounded-xl border border-emerald-100 w-full" alt="Preview" />}
        </div>

        <div className="space-y-4">
          {result?.health?.diseases?.map((disease: any, idx: number) => (
            <div key={idx} className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg">{disease.name}</h3>
                  <p className="text-xs text-zinc-500">Confidence: {(disease.probability * 100).toFixed(1)}%</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                  disease.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {disease.severity}
                </span>
              </div>

              {/* TREATMENT BOX - This will now show the actual text */}
              <div className="mt-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">Treatment Guide</p>
                <p className="text-sm text-zinc-700 leading-relaxed italic">
                  "{disease.treatment}"
                </p>
              </div>
            </div>
          ))}

          {!result && !loading && (
            <p className="text-center text-zinc-400 py-20 border border-dashed rounded-2xl">Results will appear here...</p>
          )}
        </div>
      </div>
    </main>
  );
}