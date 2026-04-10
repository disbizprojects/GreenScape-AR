import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (order.userId.toString() === session.user.id || session.user.role === "ADMIN") {
    return NextResponse.json(order);
  }

  if (session.user.role === "VENDOR") {
    const vendorPlants = await Plant.find({ vendorId: session.user.id }).distinct("_id");
    const vendorSet = new Set(vendorPlants.map(String));
    const touches = order.items.some((i) => vendorSet.has(i.plantId.toString()));
    if (touches) return NextResponse.json(order);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

const trackSchema = z.object({
  status: z.enum([
    "ORDER_CONFIRMED",
    "PACKED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ]),
  note: z.string().optional(),
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
  const parsed = trackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tracking update" }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "ADMIN" && session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role === "VENDOR") {
    const vendorPlants = await Plant.find({ vendorId: session.user.id }).distinct("_id");
    const vendorSet = new Set(vendorPlants.map(String));
    const touches = order.items.some((i) => vendorSet.has(i.plantId.toString()));
    if (!touches) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  order.status = parsed.data.status;
  order.tracking.push({
    status: parsed.data.status,
    at: new Date(),
    note: parsed.data.note,
  });
  await order.save();
  return NextResponse.json(order);
}
