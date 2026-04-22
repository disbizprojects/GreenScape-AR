import { NextResponse } from "next/server";

type PlantIdDisease = {
  name?: string;
  disease_name?: string;
  probability?: number;
  confidence?: number;
  // This is what allows us to see the "Professional" details
  details?: {
    description?: string;
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
    health: { status: "Mock Mode", diseases: [] },
    note: note || "Check API Key"
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Image file required" }, { status: 400 });
  }

  const key = process.env.PLANT_ID_API_KEY;

  // Your logic: Only run if key exists, otherwise mock
  if (key) {
    try {
      const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
      
      // We add "details" to the payload to get the text you see in the screenshot
      const payload = {
        images: [base64Image],
        details: ["description", "treatment", "cause"], 
      };

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

      const identData = await identRes.json();
      const healthData = await healthRes.json();

      const suggestions = identData?.result?.classification?.suggestions;
      const topSuggestion = Array.isArray(suggestions) ? suggestions[0] : undefined;
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
            
            // Combine biological, chemical, and prevention tips into one string
            const t = disease.details?.treatment;
            const combinedTips = [
              ...(t?.biological || []),
              ...(t?.chemical || []),
              ...(t?.prevention || [])
            ].join("\n\n");

            return {
              name: disease.name || disease.disease_name,
              probability: disease.probability || disease.confidence || 0,
              // Show treatment tips if they exist, otherwise show description
              treatment: combinedTips || disease.details?.description || "No specific details found.",
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