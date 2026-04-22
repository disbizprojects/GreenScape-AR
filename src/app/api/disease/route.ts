import { NextResponse } from "next/server";
import { diseaseData } from "@/lib/diseaseData";

type PlantIdDisease = {
  name?: string;
  disease_name?: string;
  probability?: number;
  confidence?: number;
  description?: string;
};

// Function to get disease info from database
function getDiseaseInfo(diseaseName: string) {
  const lowerName = diseaseName.toLowerCase();
  const matched = diseaseData.find(disease =>
    disease.keywords.some(keyword => lowerName.includes(keyword))
  );
  
  if (matched) {
    return {
      cause: matched.cause,
      treatment: matched.treatment,
      prevention: matched.prevention
    };
  }
  
  // Default return if no match found
  return {
    cause: "Information not available in database. Could be fungal, bacterial, pest, nutrient deficiency, or environmental stress.",
    treatment: "Consult a local plant expert, agricultural extension service, or professional arborist for accurate diagnosis and treatment.",
    prevention: "Regular monitoring, proper watering, balanced fertilization, good air circulation, and maintaining overall plant health."
  };
}

function mockResponse(note?: string) {
  // Mock diseases that will also use the database
  const mockDiseases = [
    { name: "scALe insects", probability: 0.65, severity: "Moderate" },
    { name: "leaf spot", probability: 0.45, severity: "Low" }
  ];
  
  // Get treatment info from database for each mock disease
  const diseasesWithInfo = mockDiseases.map(disease => {
    const diseaseInfo = getDiseaseInfo(disease.name);
    return {
      name: disease.name,
      probability: disease.probability,
      severity: disease.severity,
      cause: diseaseInfo.cause,
      treatment: diseaseInfo.treatment,
      prevention: diseaseInfo.prevention,
    };
  });
  
  return NextResponse.json({
    source: "mock",
    plant: {
      name: "Monstera Deliciosa (Mock)",
      probability: 0.95,
      similar_images: 3,
    },
    health: {
      status: "Issues detected",
      diseases: diseasesWithInfo,
    },
    note: note ?? "Mock response - Using local disease database",
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Image file required" }, { status: 400 });
    }

    const key = process.env.PLANT_ID_API_KEY;

    if (!key) return mockResponse();

    const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
    const payload = { images: [base64Image] };

    const identRes = await fetch("https://api.plant.id/v3/identification", {
      method: "POST",
      headers: {
        "Api-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!identRes.ok) return mockResponse("Identification failed");

    const identData = await identRes.json();

    const healthRes = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: {
        "Api-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!healthRes.ok) return mockResponse("Health check failed");

    const healthData = await healthRes.json();

    const top = identData?.result?.classification?.suggestions?.[0];
    const rawDiseases = healthData?.result?.disease?.suggestions || [];

    // Process each disease and get info from our database
    const processedDiseases = rawDiseases.map((d: PlantIdDisease) => {
      const name = d.name || d.disease_name || "Unknown";
      const prob = d.probability || d.confidence || 0;
      
      // Get disease info from database based on the detected name
      const diseaseInfo = getDiseaseInfo(name);
      
      return {
        name: name,
        probability: prob,
        severity: prob > 0.7 ? "High" : prob > 0.4 ? "Moderate" : "Low",
        cause: diseaseInfo.cause,
        treatment: diseaseInfo.treatment,
        prevention: diseaseInfo.prevention,
      };
    });

    return NextResponse.json({
      source: "plant.id-live",
      plant: {
        name: top?.name || "Unknown",
        probability: top?.probability || 0,
        similar_images: top?.similar_images?.length || 0,
      },
      health: {
        status: rawDiseases.length ? "Issues detected" : "Healthy",
        diseases: processedDiseases,
      },
    });

  } catch (err) {
    return mockResponse("Server crashed");
  }
}