import { NextResponse } from "next/server";
import { z } from "zod";

type PlantIdDisease = {
  name?: string;
  disease_name?: string;
  probability?: number;
  confidence?: number;
  description?: string;
};

type NormalizedDisease = {
  name: string;
  probability: number;
  treatment: string;
  severity: "High" | "Moderate" | "Low";
};

const FREE_TIER_LIMIT_MESSAGE =
  "Plant.id free weekly usage is finished. Please try again next week.";

const treatmentSchema = z.object({
  treatments: z.array(
    z.object({
      name: z.string(),
      treatment: z.string(),
    })
  ),
});

function freeTierLimitResponse() {
  return NextResponse.json({ error: FREE_TIER_LIMIT_MESSAGE }, { status: 429 });
}

function fallbackTreatment(diseaseName: string, description?: string) {
  return (
    description ||
    `Monitor ${diseaseName.toLowerCase()} closely, improve airflow, and follow the plant care guidance for this condition.`
  );
}

async function generateTreatments(
  plantName: string,
  diseases: NormalizedDisease[]
): Promise<NormalizedDisease[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || diseases.length === 0) {
    return diseases.map((disease) => ({
      ...disease,
      treatment: disease.treatment || fallbackTreatment(disease.name),
    }));
  }

  const prompt = `You are a plant care assistant. The plant is ${plantName}.
The detected diseases are:
${diseases
  .map(
    (disease, index) =>
      `${index + 1}. ${disease.name} (confidence ${(disease.probability * 100).toFixed(1)}%).`
  )
  .join("\n")}

Return JSON only with this shape:
{"treatments":[{"name":"disease name","treatment":"one concise practical treatment paragraph"}]}

Write treatments that are specific, safe, and actionable. Do not include markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      return diseases.map((disease) => ({
        ...disease,
        treatment: disease.treatment || fallbackTreatment(disease.name, disease.treatment),
      }));
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();
    if (!text) {
      return diseases.map((disease) => ({
        ...disease,
        treatment: disease.treatment || fallbackTreatment(disease.name, disease.treatment),
      }));
    }

    const parsed = treatmentSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return diseases.map((disease) => ({
        ...disease,
        treatment: disease.treatment || fallbackTreatment(disease.name, disease.treatment),
      }));
    }

    const treatmentsByName = new Map(
      parsed.data.treatments.map((item) => [item.name.trim().toLowerCase(), item.treatment.trim()])
    );

    return diseases.map((disease) => ({
      ...disease,
      treatment:
        treatmentsByName.get(disease.name.trim().toLowerCase()) ||
        disease.treatment ||
        fallbackTreatment(disease.name, disease.treatment),
    }));
  } catch {
    return diseases.map((disease) => ({
      ...disease,
      treatment: disease.treatment || fallbackTreatment(disease.name, disease.treatment),
    }));
  }
}

/**
 * If PLANT_ID_API_KEY is set, forwards to Plant.id identification and health APIs.
 * If Plant.id cannot respond, returns a quota-style error instead of a mock result.
 * @see https://plant.id/
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Image file required (field: image)" }, { status: 400 });
  }

  const key = process.env.PLANT_ID_API_KEY;
  if (key) {
    try {
      const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
      const payload = {
        images: [base64Image],
      };

      const identRes = await fetch("https://api.plant.id/v3/identification", {
        method: "POST",
        headers: {
          "Api-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!identRes.ok) {
        return freeTierLimitResponse();
      }

      const identData = await identRes.json();
      if (!identData?.result) {
        return freeTierLimitResponse();
      }

      const healthRes = await fetch("https://api.plant.id/v3/health_assessment", {
        method: "POST",
        headers: {
          "Api-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!healthRes.ok) {
        return freeTierLimitResponse();
      }

      const healthData = await healthRes.json();
      if (!healthData?.result) {
        return freeTierLimitResponse();
      }

      const suggestions = identData?.result?.classification?.suggestions;
      const topSuggestion = Array.isArray(suggestions) ? suggestions[0] : undefined;
      const plantName = topSuggestion?.name ?? identData?.result?.is_plant?.name ?? "Unknown";
      const plantProbability =
        typeof topSuggestion?.probability === "number" ? topSuggestion.probability : 0;

      const healthResult = healthData?.result;
      const rawDiseases = Array.isArray(healthResult?.disease?.suggestions)
        ? healthResult.disease.suggestions
        : [];
      const normalizedDiseases: NormalizedDisease[] = rawDiseases.map(
        (disease: PlantIdDisease) => {
          const probability = disease.probability || disease.confidence || 0;
          return {
            name: disease.name || disease.disease_name || "Unknown disease",
            probability,
            treatment: fallbackTreatment(
              disease.name || disease.disease_name || "Unknown disease",
              disease.description
            ),
            severity:
              probability > 0.7 ? "High" : probability > 0.4 ? "Moderate" : "Low",
          };
        }
      );

      const treatedDiseases = await generateTreatments(plantName, normalizedDiseases);

      return NextResponse.json({
        source: "plant.id-live",
        plant: {
          name: plantName,
          probability: plantProbability,
          similar_images: Array.isArray(topSuggestion?.similar_images)
            ? topSuggestion.similar_images.length
            : 0,
        },
        health: {
          status: rawDiseases.length === 0 ? "Healthy" : "Issues detected",
          diseases: treatedDiseases,
        },
      });
    } catch (err) {
      return freeTierLimitResponse();
    }
  }

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
          treatment:
            "Check soil pH and micronutrients; consider chelated iron if deficiency is confirmed.",
          severity: "Moderate",
        },
        {
          name: "Root rot (early signs)",
          probability: 0.32,
          treatment: "Reduce watering frequency, improve drainage, and repot if necessary.",
          severity: "Low",
        },
      ],
    },
    note:
      "This is a mock response. Set PLANT_ID_API_KEY in .env.local for live disease detection using Plant.id API.",
  });
}