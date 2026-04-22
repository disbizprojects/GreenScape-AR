import { NextResponse } from "next/server";

type PlantIdDisease = {
  name?: string;
  disease_name?: string;
  probability?: number;
  confidence?: number;
  details?: {
    description?: string;
    treatment?: {
      biological?: string[];
      chemical?: string[];
      prevention?: string[];
    };
    cause?: string;
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
          treatment: "Check soil pH and micronutrients; consider chelated iron if deficiency is confirmed.",
          severity: "Moderate",
        }
      ],
    },
    note: note ?? "Mock mode active.",
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
      
      // THE FIX: Added 'details' to the payload
      const payload = {
        images: [base64Image],
        details: ["description", "treatment", "cause"], 
      };

      // We run Identification and Health Assessment simultaneously
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
        return mockResponse("Plant.id API error. Showing mock response.");
      }

      const identData = await identRes.json();
      const healthData = await healthRes.json();

      const topSuggestion = identData?.result?.classification?.suggestions?.[0];
      const rawDiseases = healthData?.result?.disease?.suggestions || [];

      return NextResponse.json({
        source: "plant.id-live",
        plant: {
          name: topSuggestion?.name ?? "Unknown",
          probability: topSuggestion?.probability ?? 0,
          similar_images: topSuggestion?.similar_images?.length ?? 0,
        },
        health: {
          status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
          diseases: rawDiseases.map((disease: PlantIdDisease) => {
            // Logic: Combine biological, chemical, and prevention into one detailed text
            const dt = disease.details?.treatment;
            const treatmentText = [
              ...(dt?.biological || []),
              ...(dt?.chemical || []),
              ...(dt?.prevention || [])
            ].join(" ");

            return {
              name: disease.name || disease.disease_name,
              probability: disease.probability || disease.confidence || 0,
              // Fallback logic: Use treatment text, then description, then default text
              treatment: treatmentText || disease.details?.description || "No specific details available.",
              severity: (disease.probability || 0) > 0.7 ? "High" : (disease.probability || 0) > 0.4 ? "Moderate" : "Low",
            };
          }),
        },
      });
    } catch (err) {
      return mockResponse("API connection failed.");
    }
  }
  return mockResponse();
}