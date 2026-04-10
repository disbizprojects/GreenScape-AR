import { NextResponse } from "next/server";

/**
 * If PLANT_ID_API_KEY is set, forwards to Plant.id identification API.
 * Otherwise returns a structured mock for local development.
 * @see https://plant.id/
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Image file required (field: image)" }, { status: 400 });
  }

  const key = process.env.PLANT_ID_API_KEY;
  if (key) {
    const fd = new FormData();
    fd.append("images", file);
    const res = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: { "Api-Key": key },
      body: fd,
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Plant.id request failed", detail: await res.text() },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ source: "plant.id", raw: data });
  }

  return NextResponse.json({
    source: "mock",
    disease: {
      name: "Interveinal chlorosis (demo)",
      severity: "Moderate",
      treatment:
        "Check soil pH and micronutrients; consider chelated iron if deficiency is confirmed.",
      prevention:
        "Use balanced fertilizer and ensure drainage. Replace mock mode with Plant.id API key for real scans.",
    },
    note: "Set PLANT_ID_API_KEY in .env.local for live disease detection.",
  });
}
