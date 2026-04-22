import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  plantId: z.string(),
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

  const nextWaterAt = addDays(new Date(), plant.waterFrequencyDays);
  user.carePlans.push({
    plantId: plant._id,
    plantName: plant.name,
    frequencyDays: plant.waterFrequencyDays,
    nextWaterAt,
  });
  await user.save();

  return NextResponse.json({ ok: true, carePlans: user.carePlans });
}
