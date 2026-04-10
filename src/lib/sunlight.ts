import type { SunlightNeed } from "@/models/Plant";
import SunCalc from "suncalc";

export type CompatibilityLabel = "Highly Suitable" | "Moderately Suitable" | "Not Recommended";

export interface SunlightAnalysis {
  sunAltitudeDeg: number;
  sunAzimuthDeg: number;
  estimatedDaylightQuality: number;
  /** 0–100 */
  compatibilityScore: number;
  label: CompatibilityLabel;
  summary: string;
}

function needToMinHours(need: SunlightNeed): number {
  switch (need) {
    case "FULL_SUN":
      return 6;
    case "PARTIAL_SHADE":
      return 3;
    case "FULL_SHADE":
      return 1;
    default:
      return 4;
  }
}

/**
 * Combines sun position at "now", cloud cover proxy, and plant need.
 * This is an educational heuristic — not a substitute for a light meter.
 */
export function analyzeSunlight(args: {
  lat: number;
  lng: number;
  date?: Date;
  plantNeed: SunlightNeed;
  cloudCoverPct: number;
}): SunlightAnalysis {
  const date = args.date ?? new Date();
  const pos = SunCalc.getPosition(date, args.lat, args.lng);
  const altitudeDeg = (pos.altitude * 180) / Math.PI;
  const azimuthDeg = (pos.azimuth * 180) / Math.PI;

  const cloudFactor = 1 - args.cloudCoverPct / 100;
  const altitudeFactor = Math.max(0, Math.min(1, (altitudeDeg + 5) / 60));
  const estimatedDaylightQuality = Math.round(100 * cloudFactor * altitudeFactor);

  const needHours = needToMinHours(args.plantNeed);
  const effectiveHours = 6 * cloudFactor * altitudeFactor;
  const rawScore = Math.min(
    100,
    Math.round(
      Math.min(1, effectiveHours / Math.max(needHours, 0.5)) * 72 +
        estimatedDaylightQuality * 0.28
    )
  );

  let label: CompatibilityLabel;
  if (rawScore >= 72) label = "Highly Suitable";
  else if (rawScore >= 45) label = "Moderately Suitable";
  else label = "Not Recommended";

  const summary = `Sun altitude ${altitudeDeg.toFixed(1)}°, cloud cover ${args.cloudCoverPct}%. Heuristic match for ${args.plantNeed.replace("_", " ").toLowerCase()}.`;

  return {
    sunAltitudeDeg: altitudeDeg,
    sunAzimuthDeg: azimuthDeg,
    estimatedDaylightQuality,
    compatibilityScore: rawScore,
    label,
    summary,
  };
}
