import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import User from "@/models/User";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plants = await Plant.find({
    _id: { $in: user.favoritePlantIds },
    active: true,
  }).lean();

  return NextResponse.json(plants);
}

const bodySchema = z.object({
  plantId: z.string(),
  action: z.enum(["add", "remove"]),
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
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = parsed.data.plantId;
  const set = new Set(user.favoritePlantIds.map((x) => x.toString()));
  if (parsed.data.action === "add") set.add(id);
  else set.delete(id);

  user.favoritePlantIds = [...set].map((s) => new Types.ObjectId(s));
  await user.save();

  return NextResponse.json({ ok: true, favoritePlantIds: [...set] });
}
