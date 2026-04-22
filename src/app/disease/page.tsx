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
      setResult({ error: "Failed to connect to the server." });
    } finally {
      setLoading(false);
      e.target.value = ""; 
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 font-sans antialiased text-zinc-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-950">Leaf Health Report</h1>
          <p className="text-zinc-500 text-sm mt-1">Full Diagnosis & Professional Treatment Guide</p>
        </div>
        <label className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition cursor-pointer shadow-lg shadow-emerald-200">
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          {loading ? "Analyzing..." : "Upload New Scan"}
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left: Image Preview */}
        <div className="lg:col-span-5 space-y-4">
          {imagePreview ? (
            <div className="sticky top-10">
              <img src={imagePreview} className="rounded-3xl border-4 border-white shadow-2xl w-full" alt="Scan" />
              {result?.plant && (
                <div className="mt-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm text-center">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Identified Species</p>
                  <p className="text-xl font-bold">{result.plant.name}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 rounded-3xl border-4 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400">
              Select an image to start diagnosis
            </div>
          )}
        </div>

        {/* Right: Full Details */}
        <div className="lg:col-span-7 space-y-6">
          {result?.diseases?.map((disease: any, idx: number) => (
            <div key={idx} className="bg-white rounded-3xl border border-zinc-100 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-zinc-900 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">{disease.name}</h3>
                <span className="bg-emerald-500 px-3 py-1 rounded-lg text-xs font-black">
                  {(disease.probability * 100).toFixed(1)}% Match
                </span>
              </div>

              <div className="p-8 space-y-8">
                {/* Full Description / Details */}
                <div>
                  <h4 className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-3">Disease Details</h4>
                  <p className="text-zinc-600 leading-relaxed">{disease.description}</p>
                </div>

                {/* Cause */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Primary Cause</h4>
                    <p className="text-sm font-bold text-zinc-800">{disease.cause}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Severity</h4>
                    <p className={`text-sm font-bold ${disease.severity === 'High' ? 'text-red-600' : 'text-orange-600'}`}>{disease.severity}</p>
                  </div>
                </div>

                {/* TREATMENT GUIDE (Knowledge Base Data) */}
                <div className="relative p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-emerald-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      <h4 className="font-black text-sm uppercase tracking-wider">Professional Treatment Guide</h4>
                    </div>
                    <div className="text-emerald-900 text-sm leading-loose whitespace-pre-wrap">
                      {disease.treatment}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!result && !loading && (
            <div className="text-center py-20 opacity-30">
              <p className="text-xl font-bold italic">Waiting for scan data...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}