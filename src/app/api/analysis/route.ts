import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import { analyzeSunlight } from "@/lib/sunlight";
import { predictSurvival } from "@/lib/survival";
import { fetchForecastRainDays, fetchWeather } from "@/lib/weather";
import { buildWateringPlan } from "@/lib/watering";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  plantId: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analysis request" }, { status: 400 });
  }

  await connectDB();
  const plant = await Plant.findById(parsed.data.plantId).lean();
  if (!plant) {
    return NextResponse.json({ error: "Plant not found" }, { status: 404 });
  }

  const { lat, lng } = parsed.data;
  const weather = await fetchWeather(lat, lng);
  const rain = await fetchForecastRainDays(lat, lng, 7);

  const sunlight = analyzeSunlight({
    lat,
    lng,
    plantNeed: plant.sunlightRequirement,
    cloudCoverPct: weather.cloudCoverPct,
  });

  const survival = predictSurvival({
    weather,
    tempMinC: plant.tempMinC,
    tempMaxC: plant.tempMaxC,
    idealHumidityPct: plant.idealHumidityPct,
    plantSunNeed: plant.sunlightRequirement,
    sunlightLabel: sunlight.label,
    sunlightScore: sunlight.compatibilityScore,
  });

  const watering = buildWateringPlan({
    waterFrequencyDays: plant.waterFrequencyDays,
    rainNext7DaysMm: rain,
    todayPrecipitationMm: weather.precipitationMm,
  });

  return NextResponse.json({
    plant: {
      id: plant._id.toString(),
      name: plant.name,
      sunlightRequirement: plant.sunlightRequirement,
    },
    weather,
    sunlight,
    survival,
    watering,
  });
}
