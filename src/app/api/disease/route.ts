import { NextResponse } from "next/server";

/**
 * Disease Diagnosis + Treatment Guidance System
 * Uses Plant.id API for:
 * - Disease name
 * - Severity
 * - Treatment
 * - Prevention
 * - Symptoms
 */

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("image");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Image file required (field: image)" },
      { status: 400 }
    );
  }

  const key = process.env.PLANT_ID_API_KEY;

  if (key) {
    try {
      // ================= IDENTIFICATION =================
      const fd = new FormData();
      fd.append("images", file);

      const identRes = await fetch(
        "https://api.plant.id/v3/identification",
        {
          method: "POST",
          headers: { "Api-Key": key },
          body: fd,
        }
      );

      if (!identRes.ok) {
        return NextResponse.json(
          { error: "Plant identification failed", detail: await identRes.text() },
          { status: 502 }
        );
      }

      const identData = await identRes.json();

      // ================= HEALTH =================
      const fd2 = new FormData();
      fd2.append("images", file);

      const healthRes = await fetch(
        "https://api.plant.id/v3/health_assessment",
        {
          method: "POST",
          headers: { "Api-Key": key },
          body: fd2,
        }
      );

      if (!healthRes.ok) {
        return NextResponse.json(
          { error: "Health assessment failed", detail: await healthRes.text() },
          { status: 502 }
        );
      }

      const healthData = await healthRes.json();

      const plantInfo = identData?.results?.[0] || {};
      const diseases = healthData?.diseases || [];

      return NextResponse.json({
        source: "plant.id-live",

        plant: {
          name: plantInfo?.plant_name || "Unknown",
          probability: plantInfo?.probability || 0,
          similar_images: identData?.results?.length || 0,
        },

        health: {
          status: diseases.length === 0 ? "Healthy" : "Issues detected",

          diseases: diseases.map((d: any) => {
            const prob = d.probability || d.confidence || 0;

            return {
              name: d.name || d.disease_name || "Unknown Disease",

              probability: prob,

              severity:
                prob > 0.7 ? "High" : prob > 0.4 ? "Medium" : "Low",

              // ✅ Structured treatment
              treatment: {
                chemical: d.treatment?.chemical || [],
                biological: d.treatment?.biological || [],
                general: d.treatment?.prevention || [],
              },

              // ✅ Prevention
              prevention:
                d.prevention ||
                d.treatment?.prevention ||
                [],

              // ✅ Symptoms
              symptoms: d.symptoms || [],
            };
          }),
        },

        raw: {
          identification: identData,
          health_assessment: healthData,
        },
      });
    } catch (err) {
      return NextResponse.json(
        {
          error: "Plant.id API error",
          detail: err instanceof Error ? err.message : "Unknown error",
        },
        { status: 502 }
      );
    }
  }

  // ================= MOCK =================
  return NextResponse.json({
    source: "mock",

    plant: {
      name: "Tomato (Mock)",
      probability: 0.92,
      similar_images: 3,
    },

    health: {
      status: "Issues detected",

      diseases: [
        {
          name: "Early Blight",
          probability: 0.78,
          severity: "High",

          treatment: {
            chemical: ["Apply fungicide (chlorothalonil)"],
            biological: ["Use neem oil"],
            general: ["Remove infected leaves"],
          },

          prevention: [
            "Avoid overhead watering",
            "Ensure proper spacing",
            "Practice crop rotation",
          ],

          symptoms: [
            "Brown spots with concentric rings",
            "Yellowing leaves",
            "Leaf drop",
          ],
        },
      ],
    },

    note:
      "Mock response. Set PLANT_ID_API_KEY in .env.local for real detection.",
  });
}