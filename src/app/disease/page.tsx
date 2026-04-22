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
  note?: string;
}

export default function DiseasePage() {
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/disease", { method: "POST", body: fd });
      const j = await res.json();
      setResult(j);
    } catch (err) {
      setResult({
        source: "mock",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-emerald-950">🍃 Leaf Health Scan</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Upload a clear photo of a leaf to detect diseases and health issues. Set
          <code className="mx-1 rounded bg-zinc-100 px-1 text-xs">PLANT_ID_API_KEY</code>
          in server env for live detection.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Upload Area */}
        <div>
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center hover:bg-emerald-100/50 transition">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            <svg className="h-12 w-12 text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-emerald-900">
              {loading ? "Analyzing…" : "Click to upload a leaf image"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">JPG, PNG, or WebP</p>
          </label>

          {imagePreview && (
            <div className="mt-4 rounded-lg overflow-hidden border border-emerald-200">
              <img src={imagePreview} alt="Preview" className="w-full h-auto" />
            </div>
          )}
        </div>

        {/* Results Area */}
        <div>
          {result?.error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{result.error}</p>
            </div>
          )}

          {result && !result.error && (
            <div className="space-y-4">
              {/* Plant Info */}
              {result.plant && (
                <div className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-emerald-700 uppercase">Identified Plant</p>
                  <p className="text-lg font-semibold text-emerald-950 mt-1">{result.plant.name}</p>
                  <div className="flex gap-4 mt-3 text-xs">
                    <div>
                      <p className="text-zinc-500">Confidence</p>
                      <p className="font-semibold text-emerald-900">
                        {(result.plant.probability * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Similar Images</p>
                      <p className="font-semibold text-emerald-900">{result.plant.similar_images}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Status */}
              {result.health && (
                <div className={`rounded-xl border p-4 shadow-sm ${
                  result.health.status === "Healthy"
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}>
                  <p className={`text-xs font-semibold uppercase ${
                    result.health.status === "Healthy" ? "text-green-700" : "text-yellow-700"
                  }`}>
                    Health Status
                  </p>
                  <p className={`text-lg font-semibold mt-1 ${
                    result.health.status === "Healthy" ? "text-green-950" : "text-yellow-950"
                  }`}>
                    {result.health.status}
                  </p>
                </div>
              )}

              {/* Diseases */}
              {result.health?.diseases && result.health.diseases.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-700 uppercase">Detected Issues</p>
                  {result.health.diseases.map((disease, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-3 text-sm ${
                        disease.severity === "High"
                          ? "bg-red-50 border border-red-200"
                          : disease.severity === "Moderate"
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-zinc-900">{disease.name}</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          disease.severity === "High"
                            ? "bg-red-200 text-red-900"
                            : disease.severity === "Moderate"
                            ? "bg-yellow-200 text-yellow-900"
                            : "bg-blue-200 text-blue-900"
                        }`}>
                          {disease.severity}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-2">
                        Probability: {(disease.probability * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-zinc-700 mt-2">{disease.treatment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* API Source */}
              <p className="text-xs text-zinc-500 mt-4">
                {result.source === "plant.id-live" ? (
                  <span className="text-emerald-600 font-medium">✓ Live detection via Plant.id API</span>
                ) : (
                  <span>Mock response (set PLANT_ID_API_KEY for live detection)</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-12 rounded-xl bg-emerald-50 border border-emerald-200 p-6">
        <h2 className="font-semibold text-emerald-950">How to use</h2>
        <ol className="mt-3 space-y-2 text-sm text-zinc-700 list-decimal list-inside">
          <li>Take a clear photo of the affected leaf in natural light</li>
          <li>Upload the image using the form above</li>
          <li>The AI will identify the plant and detect any diseases</li>
          <li>Follow the recommended treatment and prevention steps</li>
        </ol>
        <p className="mt-4 text-xs text-zinc-600">
          <strong>Tips:</strong> Please ensure the leaf fills most of the frame, lighting is good, and the image is sharp.
          Diseased and healthy parts should be visible if possible.
        </p>
      </div>
    </main>
  );
}
