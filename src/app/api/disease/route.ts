import { NextResponse } from "next/server";

// Precise type for the Plant.id V3 Health Assessment response
type PlantIdDisease = {
  name?: string;
  disease_name?: string;
  probability?: number;
  confidence?: number;
  description?: string;
  details?: {
    treatment?: {
      biological?: string[];
      chemical?: string[];
      prevention?: string[];
    };
  };
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
    note: note ?? "Mock response. Add PLANT_ID_API_KEY to .env.local for live API data.",
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }

  const key = process.env.PLANT_ID_API_KEY;
  if (!key) return mockResponse();

  try {
    const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
    const payload = { 
      images: [base64Image],
      // We explicitly request treatment details
      details: ["description", "treatment", "common_names"] 
    };

    // Parallel execution for better speed
    const [identRes, healthRes] = await Promise.all([
      fetch("https://api.plant.id/v3/identification", {
        method: "POST",
        headers: { "Api-Key": key, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      fetch("https://api.plant.id/v3/health_assessment", {
        method: "POST",
        headers: { "Api-Key": key, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    ]);

    if (!identRes.ok || !healthRes.ok) {
      return mockResponse(`API Error: ${identRes.status}/${healthRes.status}`);
    }

    const identData = await identRes.json();
    const healthData = await healthRes.json();

    const topPlant = identData?.result?.classification?.suggestions?.[0];
    const healthSuggestions = healthData?.result?.disease?.suggestions || [];

    return NextResponse.json({
      source: "plant.id-live",
      plant: {
        name: topPlant?.name ?? "Unknown Plant",
        probability: topPlant?.probability ?? 0,
        similar_images: topPlant?.similar_images?.length ?? 0,
      },
      health: {
        status: healthSuggestions.length === 0 ? "Healthy" : "Issues detected",
        diseases: healthSuggestions.map((disease: PlantIdDisease) => {
          // Construct treatment string from biological, chemical, and prevention arrays
          const treatmentArray: string[] = [];
          const t = disease.details?.treatment;
          
          if (t?.biological) treatmentArray.push(...t.biological);
          if (t?.chemical) treatmentArray.push(...t.chemical);
          if (t?.prevention) treatmentArray.push(...t.prevention);

          const score = disease.probability || disease.confidence || 0;

          return {
            name: disease.name || disease.disease_name,
            probability: score,
            treatment: treatmentArray.length > 0 
              ? treatmentArray.join(" ") 
              : (disease.description || "No specific treatment tips provided."),
            severity: score > 0.7 ? "High" : score > 0.4 ? "Moderate" : "Low",
          };
        }),
      },
    });
  } catch (err) {
    return mockResponse(err instanceof Error ? err.message : "Analysis failed");
  }
}