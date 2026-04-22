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
    <main className="mx-auto max-w-5xl px-4 py-10 font-sans text-zinc-900">
      <h1 className="text-3xl font-bold text-emerald-950 mb-8 border-b pb-4">Leaf Health Report</h1>
      
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <span className="text-sm font-bold text-emerald-700">
              {loading ? "Analyzing Details..." : "Upload Leaf Image"}
            </span>
          </label>
          {imagePreview && <img src={imagePreview} className="rounded-2xl shadow-lg border-4 border-white" alt="Preview" />}
        </div>

        <div className="space-y-6">
          {result?.health?.diseases?.map((disease: any, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold">{disease.name}</h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{(disease.probability * 100).toFixed(0)}% Match</span>
              </div>
              
              <div className="p-5">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                  disease.severity === 'High' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {disease.severity} Severity
                </span>

                <div className="mt-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Professional Treatment & Info</h4>
                  {/* whitespace-pre-line makes the multi-line treatment tips look good */}
                  <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                    {disease.treatment}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {!result && !loading && (
            <div className="text-zinc-400 italic p-10 border-2 border-dashed rounded-2xl text-center">
              Upload a photo to see live Plant.id diagnosis and treatment.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}