import { authOptions } from "@/lib/auth";
import { sendPaymentReceiptEmail } from "@/lib/email";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await connectDB();

  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId.toString() !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.paymentStatus === "PAID") {
    return NextResponse.json(order);
  }

  for (const item of order.items) {
    const plant = await Plant.findById(item.plantId).select("stock name");
    if (!plant || plant.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${plant?.name ?? "a plant"}` },
        { status: 400 }
      );
    }
  }

  for (const item of order.items) {
    await Plant.updateOne({ _id: item.plantId }, { $inc: { stock: -item.quantity } });
  }

  order.paymentStatus = "PAID";
  if (order.status === "PENDING_PAYMENT") {
    order.status = "ORDER_CONFIRMED";
  }
  order.tracking.push({
    status: "ORDER_CONFIRMED",
    at: new Date(),
    note: "Payment completed via mock checkout",
  });

  await order.save();

  const user = await User.findById(order.userId).select("email name").lean();
  if (user?.email) {
    try {
      await sendPaymentReceiptEmail({
        userEmail: user.email,
        userName: user.name,
        orderId: order._id.toString(),
        total: order.total,
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
    } catch (error) {
      console.error("Payment receipt email failed:", error);
    }
  }

  return NextResponse.json(order);
}
