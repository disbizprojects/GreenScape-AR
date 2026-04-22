import { authOptions } from "@/lib/auth";
import {
  sendOrderStatusUpdateEmail,
} from "@/lib/email";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const statusLabels: Record<string, string> = {
  ORDER_CONFIRMED: "Order confirmed",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Handed to delivery",
  DELIVERED: "Delivered",
};

const statusNotes: Partial<Record<string, string>> = {
  PACKED: "Your order has been packed by the vendor and is ready for dispatch.",
  OUT_FOR_DELIVERY: "Your order has been handed over to the delivery partner.",
  DELIVERED: "Your order has been delivered successfully.",
};

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

  if (order.paymentStatus !== "PAID") {
    return NextResponse.json({ error: "Order must be paid before updating status" }, { status: 400 });
  }

  const nextStatus = parsed.data.status;
  if (order.status === nextStatus) {
    return NextResponse.json(order);
  }

  const allowedNextStatus =
    session.user.role === "ADMIN"
      ? order.status === "OUT_FOR_DELIVERY"
        ? "DELIVERED"
        : null
      : order.status === "ORDER_CONFIRMED"
        ? "PACKED"
        : order.status === "PACKED"
          ? "OUT_FOR_DELIVERY"
          : null;

  if (allowedNextStatus !== nextStatus) {
    return NextResponse.json({ error: "Invalid order status transition" }, { status: 400 });
  }

  order.status = nextStatus;
  order.tracking.push({
    status: nextStatus,
    at: new Date(),
    note: parsed.data.note,
  });
  await order.save();

  const user = await User.findById(order.userId).select("email name").lean();
  if (user?.email) {
    try {
      await sendOrderStatusUpdateEmail({
        userEmail: user.email,
        userName: user.name,
        orderId: order._id.toString(),
        total: order.total,
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        statusLabel: statusLabels[nextStatus],
        note: parsed.data.note ?? statusNotes[nextStatus],
      });
    } catch (error) {
      console.error("Order status email failed:", error);
    }
  }

  return NextResponse.json(order);
}
