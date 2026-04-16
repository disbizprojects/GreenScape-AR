import { NextResponse } from "next/server";

type PlantIdDisease = {
  name?: string;
  disease_name?: string;
  probability?: number;
  confidence?: number;
  description?: string;
};

function mockResponse(note?: string) {
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
          treatment:
            "Check soil pH and micronutrients; consider chelated iron if deficiency is confirmed.",
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
    note:
      note ??
      "This is a mock response. Set PLANT_ID_API_KEY in .env.local for live disease detection using Plant.id API.",
  });
}

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
      const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
      const payload = {
        images: [base64Image],
      };

      const identRes = await fetch("https://api.plant.id/v3/identification", {
        method: "POST",
        headers: {
          "Api-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!identRes.ok) {
        return mockResponse(
          `Plant.id identification failed (${identRes.status}). Showing mock response.`
        );
      }

      const identData = await identRes.json();

      const healthRes = await fetch("https://api.plant.id/v3/health_assessment", {
        method: "POST",
        headers: {
          "Api-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!healthRes.ok) {
        return mockResponse(
          `Plant.id health assessment failed (${healthRes.status}). Showing mock response.`
        );
      }

      const healthData = await healthRes.json();

      const suggestions = identData?.result?.classification?.suggestions;
      const topSuggestion = Array.isArray(suggestions) ? suggestions[0] : undefined;
      const plantName = topSuggestion?.name ?? identData?.result?.is_plant?.name ?? "Unknown";
      const plantProbability =
        typeof topSuggestion?.probability === "number" ? topSuggestion.probability : 0;

      const healthResult = healthData?.result;
      const rawDiseases = Array.isArray(healthResult?.disease?.suggestions)
        ? healthResult.disease.suggestions
        : [];

      return NextResponse.json({
        source: "plant.id-live",
        plant: {
          name: plantName,
          probability: plantProbability,
          similar_images: Array.isArray(topSuggestion?.similar_images)
            ? topSuggestion.similar_images.length
            : 0,
        },
        health: {
          status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
          diseases: rawDiseases.map((disease: PlantIdDisease) => ({
            name: disease.name || disease.disease_name,
            probability: disease.probability || disease.confidence || 0,
            treatment: disease.description || "See health details",
            severity:
              (disease.probability || disease.confidence || 0) > 0.7
                ? "High"
                : (disease.probability || disease.confidence || 0) > 0.4
                  ? "Moderate"
                  : "Low",
          })),
        },
      });
    } catch (err) {
      return mockResponse(
        `Plant.id API error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return mockResponse();
}
