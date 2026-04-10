"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  src: string;
  alt: string;
  /** Uniform scale for growth preview */
  growthScale?: number;
  className?: string;
};

export function ModelViewerPlant({ src, alt, growthScale = 1, className }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scale = useMemo(
    () => `${growthScale} ${growthScale} ${growthScale}`,
    [growthScale]
  );

  if (!ready) {
    return (
      <div
        className={
          className ??
          "flex h-[60vh] w-full items-center justify-center rounded-xl bg-zinc-100 text-zinc-500"
        }
      >
        Loading 3D viewer…
      </div>
    );
  }

  return (
    <model-viewer
      src={src}
      alt={alt}
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      touch-action="pan-y"
      shadow-intensity="1"
      exposure="1"
      environment-image="neutral"
      style={{
        width: "100%",
        height: "min(70vh, 640px)",
        borderRadius: "0.75rem",
        background: "linear-gradient(180deg, #ecfdf5 0%, #f8fafc 100%)",
      }}
      className={className}
      scale={scale}
    />
  );
}
