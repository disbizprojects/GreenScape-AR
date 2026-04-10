"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function VendorPage() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploadsConfigured, setUploadsConfigured] = useState<boolean | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 29,
    stock: 10,
    modelUrl: "",
    imageUrl: "",
    sunlightRequirement: "PARTIAL_SHADE" as const,
    tempMinC: 15,
    tempMaxC: 30,
    idealHumidityPct: 55,
    waterFrequencyDays: 5,
    category: "Indoor tropical",
    growthScalePerYear: 0.1,
    co2KgPerYearEstimate: 5,
    careTips: "Bright indirect light; water when top soil dries.",
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/session");
      const s = await res.json();
      if (!s?.user) router.push("/login");
      else if (s.user.role !== "VENDOR" && s.user.role !== "ADMIN") router.push("/");
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/upload");
      const j = await res.json().catch(() => ({}));
      setUploadsConfigured(Boolean(j.configured));
    })();
  }, []);

  const uploadFile = useCallback(
    async (file: File, kind: "cover" | "model") => {
      const setBusy = kind === "cover" ? setUploadingCover : setUploadingModel;
      setBusy(true);
      setFeedback(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFeedback({
            ok: false,
            text: j.error ?? "Upload failed. Add Cloudinary keys to .env.local or use URL fields below.",
          });
          return;
        }
        if (kind === "cover") setForm((f) => ({ ...f, imageUrl: j.url as string }));
        else setForm((f) => ({ ...f, modelUrl: j.url as string }));
        setFeedback({
          ok: true,
          text: kind === "cover" ? "Cover image uploaded." : "3D model uploaded.",
        });
      } finally {
        setBusy(false);
      }
    },
    []
  );

  async function createPlant(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price <= 0) {
      setFeedback({ ok: false, text: "Enter a valid price greater than 0." });
      return;
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      setFeedback({ ok: false, text: "Enter a valid whole number for stock." });
      return;
    }
    if (form.description.trim().length < 10) {
      setFeedback({
        ok: false,
        text: "Description must be at least 10 characters.",
      });
      return;
    }
    if (!form.modelUrl.trim()) {
      setFeedback({
        ok: false,
        text: "Upload a .glb model or paste a model URL below.",
      });
      return;
    }
    if (!form.imageUrl.trim()) {
      setFeedback({
        ok: false,
        text: "Upload a cover image or paste an image URL below.",
      });
      return;
    }

    const res = await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        stock,
        imageUrls: [form.imageUrl.trim()],
        modelUrl: form.modelUrl.trim(),
        sunlightRequirement: form.sunlightRequirement,
        tempMinC: form.tempMinC,
        tempMaxC: form.tempMaxC,
        idealHumidityPct: form.idealHumidityPct,
        waterFrequencyDays: form.waterFrequencyDays,
        category: form.category.trim(),
        growthScalePerYear: form.growthScalePerYear,
        co2KgPerYearEstimate: form.co2KgPerYearEstimate,
        careTips: form.careTips?.trim() || undefined,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback({
        ok: false,
        text: typeof j.error === "string" ? j.error : "Could not publish listing.",
      });
      return;
    }
    setFeedback({ ok: true, text: "Plant listed." });
    setForm((f) => ({
      ...f,
      name: "",
      description: "",
      modelUrl: "",
      imageUrl: "",
    }));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-950">Vendor studio</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Pick files from your computer — the dialog opens when you click the buttons. Uploads use
        Cloudinary when configured.
      </p>

      {uploadsConfigured === false ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Cloudinary is not configured</p>
          <p className="mt-1 text-amber-900/90">
            Add <code className="rounded bg-amber-100/80 px-1">CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code className="rounded bg-amber-100/80 px-1">CLOUDINARY_API_KEY</code>, and{" "}
            <code className="rounded bg-amber-100/80 px-1">CLOUDINARY_API_SECRET</code> to{" "}
            <code className="rounded bg-amber-100/80 px-1">.env.local</code>, then restart the dev
            server. You can still choose files; upload will fail until Cloudinary is set — or use the
            URL fields in “Optional: paste URL instead”.
          </p>
        </div>
      ) : null}

      <form
        onSubmit={createPlant}
        className="mt-8 space-y-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
      >
        <label className="block text-sm font-medium text-zinc-800">
          Name
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-800">
          Description
          <textarea
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-normal"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            minLength={10}
            placeholder="At least 10 characters"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-800">
            Price (USD)
            <input
              type="number"
              min={0.01}
              step={0.01}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-normal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            Stock
            <input
              type="number"
              min={0}
              step={1}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-normal"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            />
          </label>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <p className="text-sm font-semibold text-emerald-950">Cover image</p>
          <p className="mt-0.5 text-xs text-zinc-600">JPEG, PNG, or WebP · max 12 MB</p>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            disabled={uploadingCover}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadFile(f, "cover");
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
            >
              {uploadingCover ? "Uploading…" : "Choose file…"}
            </button>
            {form.imageUrl ? (
              <span className="text-xs text-emerald-800">Ready</span>
            ) : (
              <span className="text-xs text-zinc-500">No file yet</span>
            )}
          </div>
          {form.imageUrl ? (
            <div className="relative mt-3 h-36 w-full max-w-xs overflow-hidden rounded-lg border border-emerald-100 bg-white">
              <Image
                src={form.imageUrl}
                alt="Cover preview"
                fill
                className="object-cover"
                sizes="320px"
                unoptimized
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <p className="text-sm font-semibold text-emerald-950">3D model</p>
          <p className="mt-0.5 text-xs text-zinc-600">Single .glb file · max 45 MB</p>
          <input
            ref={modelInputRef}
            type="file"
            accept=".glb,application/octet-stream,model/gltf-binary"
            className="sr-only"
            tabIndex={-1}
            disabled={uploadingModel}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadFile(f, "model");
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={uploadingModel}
              onClick={() => modelInputRef.current?.click()}
            >
              {uploadingModel ? "Uploading…" : "Choose .glb…"}
            </button>
            {form.modelUrl ? (
              <span className="max-w-full truncate text-xs text-emerald-800" title={form.modelUrl}>
                Uploaded
              </span>
            ) : (
              <span className="text-xs text-zinc-500">No file yet</span>
            )}
          </div>
        </div>

        <details className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-zinc-700">
            Optional: paste URL instead
          </summary>
          <p className="mt-2 text-xs text-zinc-500">
            Use if you host files elsewhere or while testing without Cloudinary.
          </p>
          <label className="mt-2 block text-xs font-medium text-zinc-700">
            Model URL (GLB)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs"
              value={form.modelUrl}
              onChange={(e) => setForm({ ...form, modelUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>
          <label className="mt-2 block text-xs font-medium text-zinc-700">
            Cover image URL
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>
        </details>

        <label className="block text-sm font-medium text-zinc-800">
          Sunlight
          <select
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-normal"
            value={form.sunlightRequirement}
            onChange={(e) =>
              setForm({
                ...form,
                sunlightRequirement: e.target.value as typeof form.sunlightRequirement,
              })
            }
          >
            <option value="FULL_SUN">FULL_SUN</option>
            <option value="PARTIAL_SHADE">PARTIAL_SHADE</option>
            <option value="FULL_SHADE">FULL_SHADE</option>
          </select>
        </label>
        {feedback ? (
          <p
            className={`text-sm ${feedback.ok ? "text-emerald-800" : "text-red-600"}`}
            role="alert"
          >
            {feedback.text}
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Publish listing
        </button>
      </form>
    </main>
  );
}
