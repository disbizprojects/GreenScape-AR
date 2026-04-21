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
      severity: string;

      treatment: {
        chemical: string[];
        biological: string[];
        general: string[];
      };

      prevention: string[];
      symptoms: string[];
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

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/disease", {
        method: "POST",
        body: fd,
      });

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
      <h1 className="text-3xl font-semibold">🌿 Plant Disease Diagnosis</h1>

      <input type="file" accept="image/*" onChange={onFile} className="mt-6" />

      {imagePreview && (
        <img src={imagePreview} className="mt-4 rounded-lg" />
      )}

      {loading && <p className="mt-4">Analyzing...</p>}

      {result?.plant && (
        <div className="mt-6">
          <h2 className="font-semibold">Plant</h2>
          <p>{result.plant.name}</p>
          <p>Confidence: {(result.plant.probability * 100).toFixed(1)}%</p>
        </div>
      )}

      {result?.health && (
        <div className="mt-6">
          <h2 className="font-semibold">Health Status</h2>
          <p>{result.health.status}</p>
        </div>
      )}

      {result?.health?.diseases?.map((d, i) => (
        <div key={i} className="mt-6 border p-4 rounded-lg">
          <h3 className="font-semibold">{d.name}</h3>

          <p>Severity: {d.severity}</p>
          <p>Confidence: {(d.probability * 100).toFixed(1)}%</p>

          {/* Symptoms */}
          {d.symptoms.length > 0 && (
            <>
              <h4 className="mt-2 font-semibold">Symptoms</h4>
              <ul>
                {d.symptoms.map((s, j) => (
                  <li key={j}>• {s}</li>
                ))}
              </ul>
            </>
          )}

          {/* Treatment */}
          <h4 className="mt-2 font-semibold">Treatment</h4>
          {[...d.treatment.chemical,
            ...d.treatment.biological,
            ...d.treatment.general].map((t, j) => (
            <p key={j}>• {t}</p>
          ))}

          {/* Prevention */}
          {d.prevention.length > 0 && (
            <>
              <h4 className="mt-2 font-semibold">Prevention</h4>
              {d.prevention.map((p, j) => (
                <p key={j}>• {p}</p>
              ))}
            </>
          )}
        </div>
      ))}
    </main>
  );
}