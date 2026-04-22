import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  if (!file || !(file instanceof Blob)) return NextResponse.json({ error: "No image" }, { status: 400 });

  const key = process.env.PLANT_ID_API_KEY;
  if (!key) return NextResponse.json({ error: "Missing API Key" });

  try {
    const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
    
    const healthRes = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: { "Api-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        images: [base64Image],
        // Removed 'treatment' from requested details
        details: ["description", "cause", "symptoms"]
      }),
    });

    const healthData = await healthRes.json();
    const suggestions = healthData?.result?.disease?.suggestions || [];

    const detailedDiseases = suggestions.map((s: any) => {
      return {
        name: s.name,
        probability: s.probability,
        description: s.details?.description || "No description available.",
        cause: s.details?.cause || "Unknown",
        symptoms: s.details?.symptoms || "Check leaves for spots or discoloration.",
        severity: s.probability > 0.5 ? "High" : "Moderate"
      };
    });

    return NextResponse.json({
      plant: healthData?.result?.is_healthy ? "Healthy" : "Diseased",
      diseases: detailedDiseases
    });

  } catch (err) {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}