import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await connectDB();
  const plant = await Plant.findById(id).lean();
  if (!plant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plant);
}

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  modelUrl: z.string().url().optional(),
  sunlightRequirement: z.enum(["FULL_SUN", "PARTIAL_SHADE", "FULL_SHADE"]).optional(),
  tempMinC: z.number().optional(),
  tempMaxC: z.number().optional(),
  idealHumidityPct: z.number().optional(),
  waterFrequencyDays: z.number().int().min(1).optional(),
  category: z.string().optional(),
  active: z.boolean().optional(),
  careTips: z.string().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await connectDB();
  const plant = await Plant.findById(id);
  if (!plant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "ADMIN" && plant.vendorId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  Object.assign(plant, parsed.data);
  await plant.save();
  return NextResponse.json(plant);
}
