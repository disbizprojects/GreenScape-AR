"use client";
import { useState } from "react";

export default function DiseasePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("image", file);
    
    const res = await fetch("/api/disease", { method: "POST", body: fd });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-emerald-900">Plant Doctor</h1>
      
      <input type="file" onChange={onFile} className="mb-8 block w-full text-sm border border-gray-300 rounded-lg cursor-pointer bg-gray-50 p-2" />

      {loading && <div className="text-center p-10 text-xl font-bold animate-pulse">Analyzing Disease Details...</div>}

      <div className="grid gap-6">
        {result?.diseases?.map((d: any, i: number) => (
          <div key={i} className="bg-white border-2 border-emerald-100 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold">{d.name}</h2>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm uppercase font-bold">{d.severity} Risk</span>
            </div>

            <div className="p-6 space-y-6 text-zinc-800">
              {/* About Section */}
              <div>
                <h3 className="text-xs font-black uppercase text-emerald-600 tracking-widest mb-2">About the Disease</h3>
                <p className="text-sm leading-relaxed">{d.description}</p>
              </div>

              {/* Symptoms Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  <h3 className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Cause</h3>
                  <p className="text-sm font-medium">{d.cause}</p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  <h3 className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Symptoms</h3>
                  <p className="text-sm font-medium">{d.symptoms}</p>
                </div>
              </div>

              {/* THE TREATMENT SECTION (The Full Details) */}
              <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-100">
                <h3 className="flex items-center gap-2 text-emerald-700 font-bold mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Professional Treatment Guide
                </h3>
                <p className="text-sm text-emerald-900 whitespace-pre-line leading-loose">
                  {d.treatment}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}