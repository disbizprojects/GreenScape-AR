"use client";

import { useState } from "react";

export default function DiseasePage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/disease", { method: "POST", body: fd });
    const j = await res.json();
    setResult(j);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Leaf health scan</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Upload a clear photo of a leaf. Without <code className="rounded bg-zinc-100 px-1">PLANT_ID_API_KEY</code>{" "}
        the API returns a structured mock response for UI testing.
      </p>
      <label className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center text-sm text-zinc-600 hover:bg-emerald-50/40">
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        {loading ? "Analyzing…" : "Tap to upload an image"}
      </label>
      {result ? (
        <pre className="mt-6 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs text-emerald-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
