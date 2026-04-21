import { NextResponse } from "next/server";

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
          treatment: "Check soil pH and micronutrients; consider chelated iron. Ensure proper drainage.",
          severity: "Moderate",
        },
      ],
    },
    note: note ?? "This is a mock response. Set PLANT_ID_API_KEY in .env.local for live detection.",
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }

  const key = process.env.PLANT_ID_API_KEY;
  if (!key) return mockResponse();

  try {
    const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
    const payload = { images: [base64Image] };

    // Running requests in parallel to save time
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
      return mockResponse("Plant.id API returned an error. Showing mock data.");
    }

    const identData = await identRes.json();
    const healthData = await healthRes.json();

    const topSuggestion = identData?.result?.classification?.suggestions?.[0];
    const rawDiseases = healthData?.result?.disease?.suggestions || [];

    return NextResponse.json({
      source: "plant.id-live",
      plant: {
        name: topSuggestion?.name ?? "Unknown Plant",
        probability: topSuggestion?.probability ?? 0,
        similar_images: topSuggestion?.similar_images?.length ?? 0,
      },
      health: {
        status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
        diseases: rawDiseases.map((disease: PlantIdDisease) => {
          // Extracting treatment steps from API details
          const treatmentParts: string[] = [];
          if (disease.details?.treatment?.biological) treatmentParts.push(...disease.details.treatment.biological);
          if (disease.details?.treatment?.chemical) treatmentParts.push(...disease.details.treatment.chemical);
          if (disease.details?.treatment?.prevention) treatmentParts.push(...disease.details.treatment.prevention);

          const prob = disease.probability || disease.confidence || 0;

          return {
            name: disease.name || disease.disease_name,
            probability: prob,
            treatment: treatmentParts.length > 0 
              ? treatmentParts.join(" ") 
              : (disease.description || "No specific treatment found."),
            severity: prob > 0.7 ? "High" : prob > 0.4 ? "Moderate" : "Low",
          };
        }),
      },
    });
  } catch (err) {
    return mockResponse(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}