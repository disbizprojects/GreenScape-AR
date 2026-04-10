import type { SunlightNeed } from "@/models/Plant";
import type { CompatibilityLabel } from "@/lib/sunlight";
import type { WeatherSnapshot } from "@/lib/weather";

export interface SurvivalResult {
  survivalPct: number;
  factors: string[];
}

export function predictSurvival(args: {
  weather: WeatherSnapshot;
  tempMinC: number;
  tempMaxC: number;
  idealHumidityPct: number;
  plantSunNeed: SunlightNeed;
  sunlightLabel: CompatibilityLabel;
  sunlightScore: number;
}): SurvivalResult {
  const factors: string[] = [];
  let score = 50;

  const { temperatureC, relativeHumidityPct, precipitationMm } = args.weather;

  if (temperatureC >= args.tempMinC && temperatureC <= args.tempMaxC) {
    score += 18;
    factors.push("Temperature is within the plant's comfort range.");
  } else {
    const dist = Math.min(
      Math.abs(temperatureC - args.tempMinC),
      Math.abs(temperatureC - args.tempMaxC)
    );
    score -= Math.min(25, dist * 2);
    factors.push("Temperature is outside the ideal band — seasonal protection may be needed.");
  }

  const humDiff = Math.abs(relativeHumidityPct - args.idealHumidityPct);
  score += Math.max(-12, 12 - humDiff / 3);
  if (humDiff < 15) factors.push("Humidity is close to ideal.");
  else factors.push("Humidity differs from ideal — misting or airflow may help.");

  if (precipitationMm > 5) {
    score += 4;
    factors.push("Recent rainfall may reduce manual watering needs.");
  }

  score += Math.round(args.sunlightScore * 0.22);
  if (args.sunlightLabel === "Highly Suitable") {
    factors.push("Sunlight compatibility looks strong for this placement.");
  } else if (args.sunlightLabel === "Not Recommended") {
    score -= 15;
    factors.push("Sunlight conditions are a concern for long-term health.");
  }

  const survivalPct = Math.max(5, Math.min(98, Math.round(score)));
  return { survivalPct, factors };
}
