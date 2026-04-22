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
      cause?: string;
      prevention?: string;
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

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/disease", {
        method: "POST",
        body: fd,
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Bad response:", text);
        throw new Error("Invalid server response");
      }

      setResult(data);
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
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-emerald-950">
          🍃 Leaf Health Scan
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Upload a clear photo of a leaf to detect diseases and health issues.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center hover:bg-emerald-100/50 transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />

            <svg
              className="h-12 w-12 text-emerald-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            <p className="text-sm font-medium text-emerald-900">
              {loading ? "Analyzing…" : "Click to upload a leaf image"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              JPG, PNG, WebP supported
            </p>
          </label>

          {imagePreview && (
            <div className="mt-4 rounded-lg overflow-hidden border border-emerald-200 shadow-sm">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto"
              />
            </div>
          )}
        </div>

        {/* Result Section */}
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
                  <p className="text-xs font-semibold text-emerald-700 uppercase">
                    Identified Plant
                  </p>
                  <p className="text-lg font-semibold text-emerald-950 mt-1">
                    {result.plant.name}
                  </p>

                  <div className="flex gap-4 mt-3 text-xs">
                    <div>
                      <p className="text-zinc-500">Confidence</p>
                      <p className="font-semibold text-emerald-900">
                        {(result.plant.probability * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Similar Images</p>
                      <p className="font-semibold text-emerald-900">
                        {result.plant.similar_images}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Status */}
              {result.health && (
                <div
                  className={`rounded-xl border p-4 shadow-sm ${
                    result.health.status === "Healthy"
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase ${
                      result.health.status === "Healthy"
                        ? "text-green-700"
                        : "text-yellow-700"
                    }`}
                  >
                    Health Status
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {result.health.status}
                  </p>
                </div>
              )}

              {/* Diseases */}
              {result.health?.diseases?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-700 uppercase">
                    Detected Issues
                  </p>

                  {result.health.diseases.map((disease, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-4 text-sm ${
                        disease.severity === "High"
                          ? "bg-red-50 border border-red-200"
                          : disease.severity === "Moderate"
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="font-semibold">{disease.name}</p>
                        <span className="text-xs font-semibold">
                          {disease.severity}
                        </span>
                      </div>

                      <p className="text-xs mt-2">
                        Probability: {(disease.probability * 100).toFixed(1)}%
                      </p>

                      <p className="text-xs mt-2">
                        <strong>Cause:</strong> {disease.cause}
                      </p>
                      <p className="text-xs">
                        <strong>Treatment:</strong> {disease.treatment}
                      </p>
                      <p className="text-xs">
                        <strong>Prevention:</strong> {disease.prevention}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Source */}
              <p className="text-xs text-zinc-500">
                {result.source === "plant.id-live"
                  ? "✓ Live detection via Plant.id API"
                  : "ℹ️ Mock response (using local disease database)"}
              </p>
              
              {result.note && (
                <p className="text-xs text-zinc-400 italic">
                  {result.note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-12 rounded-xl bg-emerald-50 border border-emerald-200 p-6">
        <h2 className="font-semibold text-emerald-950">How to use</h2>
        <ol className="mt-3 space-y-2 text-sm list-decimal list-inside">
          <li>Take a clear photo of the leaf</li>
          <li>Upload it above</li>
          <li>View detected diseases and solutions from our database</li>
        </ol>
      </div>
    </main>
  );
}