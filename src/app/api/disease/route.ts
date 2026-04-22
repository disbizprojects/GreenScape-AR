import { NextResponse } from "next/server";

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
      // We must explicitly ask for these fields to get the "Details" content
      details: ["description", "treatment", "common_names", "cause"],
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

    const rawDiseases = healthData?.result?.disease?.suggestions || [];

    return NextResponse.json({
      source: "plant.id-live",
      plant: {
        name: identData?.result?.classification?.suggestions?.[0]?.name ?? "Unknown Plant",
      },
      health: {
        status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
        diseases: rawDiseases.map((disease: any) => {
          // Accessing the nested treatment details
          const t = disease.details?.treatment || {};
          const tips = [
            ...(t.biological || []),
            ...(t.chemical || []),
            ...(t.prevention || [])
          ];

          return {
            name: disease.name || disease.disease_name,
            probability: disease.probability || 0,
            // Fallback: Use tips if available, otherwise use description
            treatment: tips.length > 0 ? tips.join(" ") : (disease.description || "No specific treatment details found."),
            severity: (disease.probability || 0) > 0.7 ? "High" : (disease.probability || 0) > 0.4 ? "Moderate" : "Low",
          };
        }),
      },
    });
  } catch (err) {
    return mockResponse();
  }
}

function mockResponse() {
  return NextResponse.json({
    source: "mock",
    health: { status: "Mock Mode", diseases: [] }
  });
}