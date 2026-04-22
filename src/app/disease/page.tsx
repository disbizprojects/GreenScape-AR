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
              {/* Treatment Section Removed */}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}