import { addDays, formatISO, startOfDay } from "date-fns";

export function buildWateringPlan(args: {
  waterFrequencyDays: number;
  rainNext7DaysMm: number[];
  todayPrecipitationMm: number;
  temperatureC: number;
  soilType: SoilType;
  soilMoisturePercent: number; // from ESP32 (0–100)
}): WateringPlan {
  const notes: string[] = [];

  let interval = Math.max(1, args.waterFrequencyDays);

  let adjustedForRain = false;
  let adjustedForTemp = false;
  let adjustedForSoil = false;
  let adjustedForMoisture = false;

  // -------------------------
  // 🌧️ Rain Adjustment
  // -------------------------
  const rainSoon = args.rainNext7DaysMm.some((mm) => mm > 3);

  if (rainSoon || args.todayPrecipitationMm > 2) {
    interval *= 1.3;
    adjustedForRain = true;
    notes.push("Rain expected — increasing interval.");
  }

  // -------------------------
  // 🌡️ Temperature Adjustment
  // -------------------------
  if (args.temperatureC > 32) {
    interval *= 0.75; // water sooner
    adjustedForTemp = true;
    notes.push("High temperature — soil dries faster.");
  } else if (args.temperatureC < 18) {
    interval *= 1.2; // slower evaporation
    adjustedForTemp = true;
    notes.push("Cool weather — soil retains moisture longer.");
  }

  // -------------------------
  // 🌱 Soil Type Adjustment
  // -------------------------
  if (args.soilType === "sandy") {
    interval *= 0.7; // drains fast
    adjustedForSoil = true;
    notes.push("Sandy soil — drains quickly, water more often.");
  } else if (args.soilType === "clay") {
    interval *= 1.3; // retains water
    adjustedForSoil = true;
    notes.push("Clay soil — retains water, water less frequently.");
  }

  // -------------------------
  // 💧 Soil Moisture (ESP32)
  // -------------------------
  if (args.soilMoisturePercent > 70) {
    interval *= 1.5;
    adjustedForMoisture = true;
    notes.push("Soil already wet — delaying watering.");
  } else if (args.soilMoisturePercent < 30) {
    interval *= 0.6;
    adjustedForMoisture = true;
    notes.push("Soil dry — watering sooner.");
  }

  // Final rounding
  interval = Math.max(1, Math.round(interval));

  const today = startOfDay(new Date());
  const next = addDays(today, interval);

  return {
    baseIntervalDays: args.waterFrequencyDays,
    adjustedIntervalDays: interval,
    nextSuggestedWater: formatISO(next),
    adjustedForRain,
    adjustedForTemp,
    adjustedForSoil,
    adjustedForMoisture,
    notes,
  };
}