import { NextResponse } from "next/server";

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
    
    // THE FIX: Adding 'details' here is the ONLY way to get treatment/description text
    const payload = {
      images: [base64Image],
      details: ["description", "treatment", "cause", "symptoms", "classification"],
    };

    const identRes = await fetch("https://api.plant.id/v3/identification", {
      method: "POST",
      headers: { "Api-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const healthRes = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: { "Api-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!identRes.ok || !healthRes.ok) {
      return mockResponse("Plant.id API error or limit reached.");
    }

    const identData = await identRes.json();
    const healthData = await healthRes.json();

    const topPlant = identData?.result?.classification?.suggestions?.[0];
    const rawDiseases = healthData?.result?.disease?.suggestions || [];

    return NextResponse.json({
      source: "plant.id-live",
      plant: {
        name: topPlant?.name ?? "Unknown Plant",
        probability: topPlant?.probability ?? 0,
      },
      health: {
        status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
        diseases: rawDiseases.map((disease: any) => {
          // Flatten the treatment object arrays into a single readable block
          const t = disease.details?.treatment || {};
          const treatmentTips = [
            ...(t.biological || []),
            ...(t.chemical || []),
            ...(t.prevention || [])
          ];

          return {
            name: disease.name || disease.disease_name,
            probability: disease.probability || 0,
            // Full "Details" extraction
            description: disease.details?.description || "No description available.",
            cause: disease.details?.cause || "Environmental or Pathogenic",
            treatment: treatmentTips.length > 0 
              ? treatmentTips.join("\n\n") 
              : "Consult a local agricultural specialist for treatment steps.",
            severity: (disease.probability || 0) > 0.6 ? "High" : (disease.probability || 0) > 0.3 ? "Moderate" : "Low",
          };
        }),
      },
    });
  } catch (err) {
    return mockResponse(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

function mockResponse(note?: string) {
  return NextResponse.json({
    source: "mock",
    plant: { name: "Monstera (Mock)", probability: 0.95 },
    health: {
      status: "Issues detected",
      diseases: [{
        name: "Mock Disease",
        probability: 0.88,
        description: "This is a sample description of a plant disease.",
        cause: "Sample Cause",
        treatment: "Step 1: Water less. Step 2: Repot.",
        severity: "High",
      }],
    },
    note: note ?? "Add API key to .env.local for live full details.",
  });
}