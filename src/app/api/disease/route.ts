import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }

  const key = process.env.PLANT_ID_API_KEY;
  // If no key, return the mock automatically
  if (!key) return mockResponse();

  try {
    const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
    
    // CRITICAL FIX: You MUST request 'details' to get treatment/description text
    const payload = {
      images: [base64Image],
      details: ["description", "treatment", "common_names"],
    };

    // Parallel calls to speed up the UI
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

    if (!identRes.ok || !healthRes.ok) throw new Error("API Limit or Error");

    const identData = await identRes.json();
    const healthData = await healthRes.json();

    const topPlant = identData?.result?.classification?.suggestions?.[0];
    const rawDiseases = healthData?.result?.disease?.suggestions || [];

    return NextResponse.json({
      source: "plant.id-live",
      plant: {
        name: topPlant?.name ?? "Unknown Plant",
        probability: topPlant?.probability ?? 0,
        similar_images: topPlant?.similar_images?.length ?? 0,
      },
      health: {
        status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
        diseases: rawDiseases.map((disease: any) => {
          // Plant.id puts treatment tips in details.treatment or description
          const treatmentText = 
            disease.details?.treatment?.biological?.join(" ") || 
            disease.details?.treatment?.chemical?.join(" ") || 
            disease.description || 
            "No specific treatment available for this condition.";

          return {
            name: disease.name || disease.disease_name,
            probability: disease.probability || 0,
            treatment: treatmentText,
            severity: (disease.probability || 0) > 0.7 ? "High" : (disease.probability || 0) > 0.4 ? "Moderate" : "Low",
          };
        }),
      },
    });
  } catch (err) {
    return mockResponse("Live API error. Showing mock results.");
  }
}

// Keep your mock function exactly as it is
function mockResponse(note?: string) {
  return NextResponse.json({
    source: "mock",
    plant: { name: "Monstera Deliciosa (Mock)", probability: 0.95, similar_images: 3 },
    health: {
      status: "Issues detected",
      diseases: [{
        name: "Interveinal chlorosis",
        probability: 0.65,
        treatment: "Check soil pH and micronutrients; consider iron supplements.",
        severity: "Moderate",
      }],
    },
    note: note ?? "Mock mode active.",
  });
}