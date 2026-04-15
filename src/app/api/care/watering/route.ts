import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import User from "@/models/User";
import { sendWateringScheduleEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  plantId: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  plantName: z.string().optional(),
  wateringSchedule: z.object({
    nextSuggestedWater: z.string(),
    adjustedForRain: z.boolean(),
    notes: z.array(z.string()),
  }).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectDB();
  const plant = await Plant.findById(parsed.data.plantId).lean();
  if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Use provided plant name or fallback to database name
  const plantName = parsed.data.plantName || plant.name;
  
  // Use provided next watering date or calculate from frequency
  const nextWaterAt = parsed.data.wateringSchedule?.nextSuggestedWater
    ? new Date(parsed.data.wateringSchedule.nextSuggestedWater)
    : addDays(new Date(), plant.waterFrequencyDays);

  user.carePlans.push({
    plantId: plant._id,
    plantName: plantName,
    frequencyDays: plant.waterFrequencyDays,
    nextWaterAt,
  });
  await user.save();

  // Send watering schedule email if Gmail is configured
  try {
    if (parsed.data.lat && parsed.data.lng) {
      await sendWateringScheduleEmail(
        user.email,
        user.name || "Plant Lover",
        plantName,
        nextWaterAt.toISOString(),
        {
          lat: parsed.data.lat,
          lng: parsed.data.lng,
        }
      );
    }
  } catch (emailError) {
    console.error("Email sending failed:", emailError);
    // Don't fail the request if email fails - the schedule was still created
  }

  return NextResponse.json({ 
    ok: true, 
    carePlans: user.carePlans,
    message: "Watering schedule created and email notification sent!" 
  });
}
