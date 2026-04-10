import connectDB from "@/lib/mongodb";
import Plant, { type SunlightNeed } from "@/models/Plant";
import { analyzeSunlight } from "@/lib/sunlight";
import { fetchWeather } from "@/lib/weather";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const indoor = searchParams.get("indoor") === "1";
  const lowMaintenance = searchParams.get("lowMaintenance") === "1";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params required" },
      { status: 400 }
    );
  }

  await connectDB();
  const plants = await Plant.find({ active: true }).limit(80).lean();
  const weather = await fetchWeather(lat, lng);

  const scored = plants.map((p) => {
    const sun = analyzeSunlight({
      lat,
      lng,
      plantNeed: p.sunlightRequirement,
      cloudCoverPct: weather.cloudCoverPct,
    });

    let score = sun.compatibilityScore;
    if (indoor && p.category.toLowerCase().includes("indoor")) score += 8;
    if (lowMaintenance && p.waterFrequencyDays >= 5) score += 6;
    if (p.tempMinC <= weather.temperatureC && p.tempMaxC >= weather.temperatureC) {
      score += 5;
    }

    return {
      plant: p,
      score,
      sunlight: sun,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    weather,
    recommendations: scored.slice(0, 12).map((s) => ({
      id: s.plant._id.toString(),
      name: s.plant.name,
      category: s.plant.category,
      price: s.plant.price,
      imageUrls: s.plant.imageUrls,
      modelUrl: s.plant.modelUrl,
      sunlightRequirement: s.plant.sunlightRequirement as SunlightNeed,
      score: Math.round(s.score),
      label: s.sunlight.label,
    })),
  });
}
