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
    try {
      // First, identify the plant with the identification API
      const fd = new FormData();
      fd.append("images", file);
      fd.append("include_related_images", "false");
      fd.append("num_identifications", "1");

      const identRes = await fetch("https://api.plant.id/v3/identification", {
        method: "POST",
        headers: { "Api-Key": key },
        body: fd,
      });

      if (!identRes.ok) {
        return NextResponse.json(
          { error: "Plant identification failed", detail: await identRes.text() },
          { status: 502 }
        );
      }

      const identData = await identRes.json();

      // Now run health assessment on the same image
      const fd2 = new FormData();
      fd2.append("images", file);

      const healthRes = await fetch("https://api.plant.id/v3/health_assessment", {
        method: "POST",
        headers: { "Api-Key": key },
        body: fd2,
      });

      if (!healthRes.ok) {
        return NextResponse.json(
          { error: "Health assessment failed", detail: await healthRes.text() },
          { status: 502 }
        );
      }

      const healthData = await healthRes.json();

      // Combine and format the response
      const plantInfo = identData?.results?.[0] || {};
      const diseases = healthData?.diseases || [];

      return NextResponse.json({
        source: "plant.id-live",
        plant: {
          name: plantInfo?.plant_name || "Unknown",
          probability: plantInfo?.probability || 0,
          similar_images: identData?.results?.length || 0,
        },
        health: {
          status: diseases.length === 0 ? "Healthy" : "Issues detected",
          diseases: diseases.map((disease: any) => ({
            name: disease.name || disease.disease_name,
            probability: disease.probability || disease.confidence,
            treatment: disease.description || "See health details",
            severity: disease.probability > 0.7 ? "High" : disease.probability > 0.4 ? "Moderate" : "Low",
          })),
        },
        raw: {
          identification: identData,
          health_assessment: healthData,
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Plant.id API error", detail: err instanceof Error ? err.message : "Unknown error" },
        { status: 502 }
      );
    }
  }

  // Mock response for development
  return NextResponse.json({
    source: "mock",
    plant: {
      name: "Monstera Deliciosa (Mock)",
      probability: 0.95,
      similar_images: 3,
    },
    health: {
      status: "Issues detected",
      diseases: [
        {
          name: "Interveinal chlorosis",
          probability: 0.65,
          treatment: "Check soil pH and micronutrients; consider chelated iron if deficiency is confirmed.",
          severity: "Moderate",
        },
        {
          name: "Root rot (early signs)",
          probability: 0.32,
          treatment: "Reduce watering frequency, improve drainage, and repot if necessary.",
          severity: "Low",
        },
      ],
    },
    note: "This is a mock response. Set PLANT_ID_API_KEY in .env.local for live disease detection using Plant.id API.",
  });
}
