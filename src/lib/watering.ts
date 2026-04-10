import { addDays, formatISO } from "date-fns";

export interface WateringPlan {
  baseIntervalDays: number;
  nextSuggestedWater: string;
  adjustedForRain: boolean;
  notes: string[];
}

export function buildWateringPlan(args: {
  waterFrequencyDays: number;
  rainNext7DaysMm: number[];
  todayPrecipitationMm: number;
}): WateringPlan {
  const notes: string[] = [];
  let interval = args.waterFrequencyDays;
  let adjusted = false;

  const rainSoon = args.rainNext7DaysMm.some((mm) => mm > 3);
  if (rainSoon || args.todayPrecipitationMm > 2) {
    interval = Math.ceil(interval * 1.35);
    adjusted = true;
    notes.push("Rain in the forecast — spacing out watering to reduce overwatering risk.");
  } else {
    notes.push("No heavy rain expected — follow the usual cadence.");
  }

  const next = addDays(new Date(), interval);
  return {
    baseIntervalDays: args.waterFrequencyDays,
    nextSuggestedWater: formatISO(next),
    adjustedForRain: adjusted,
    notes,
  };
}
