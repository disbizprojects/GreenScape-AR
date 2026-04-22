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
          treatment: "Check soil pH and micronutrients; consider iron supplements.",
          severity: "Moderate",
        },
      ],
    },
    note: note ?? "This is a mock response. Set PLANT_ID_API_KEY for live detection.",
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }

  const key = process.env.PLANT_ID_API_KEY;
  if (key) {
    try {
      const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
      
      // LOGIC ADDED: Including 'details' tells the API to return descriptions/treatments
      const payload = {
        images: [base64Image],
        details: ["description", "treatment"],
      };

      const identRes = await fetch("https://api.plant.id/v3/identification", {
        method: "POST",
        headers: { "Api-Key": key, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!identRes.ok) return mockResponse("Identification failed.");

      const identData = await identRes.json();

      const healthRes = await fetch("https://api.plant.id/v3/health_assessment", {
        method: "POST",
        headers: { "Api-Key": key, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!healthRes.ok) return mockResponse("Health assessment failed.");

      const healthData = await healthRes.json();

      const suggestions = identData?.result?.classification?.suggestions;
      const topSuggestion = Array.isArray(suggestions) ? suggestions[0] : undefined;
      const plantName = topSuggestion?.name ?? "Unknown";

      const healthResult = healthData?.result;
      const rawDiseases = Array.isArray(healthResult?.disease?.suggestions)
        ? healthResult.disease.suggestions
        : [];

      return NextResponse.json({
        source: "plant.id-live",
        plant: {
          name: plantName,
          probability: topSuggestion?.probability ?? 0,
          similar_images: topSuggestion?.similar_images?.length ?? 0,
        },
        health: {
          status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
          diseases: rawDiseases.map((disease: PlantIdDisease) => ({
            name: disease.name || disease.disease_name,
            probability: disease.probability || disease.confidence || 0,
            // The API puts the treatment text into 'description' when requested
            treatment: disease.description || "No specific treatment data available.",
            severity: (disease.probability || 0) > 0.7 ? "High" : (disease.probability || 0) > 0.4 ? "Moderate" : "Low",
          })),
        },
      });
    } catch (err) {
      return mockResponse(`API error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }
  return mockResponse();
}