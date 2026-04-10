import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();

  if (session.user.role === "ADMIN") {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json(orders);
  }

  const q =
    session.user.role === "VENDOR"
      ? {
          "items.plantId": {
            $in: await Plant.find({ vendorId: session.user.id }).distinct("_id"),
          },
        }
      : { userId: session.user.id };

  const orders = await Order.find(q).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json(orders);
}

const createSchema = z.object({
  shippingAddress: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  await connectDB();
  const cart = await Cart.findOne({ userId: session.user.id });
  if (!cart?.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const plantIds = cart.items.map((i) => i.plantId);
  const plants = await Plant.find({ _id: { $in: plantIds }, active: true });
  const plantMap = new Map(plants.map((p) => [p._id.toString(), p]));

  let total = 0;
  const items: {
    plantId: (typeof plants)[0]["_id"];
    title: string;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const line of cart.items) {
    const p = plantMap.get(line.plantId.toString());
    if (!p) continue;
    if (line.quantity > p.stock) {
      return NextResponse.json(
        { error: `Insufficient stock for ${p.name}` },
        { status: 400 }
      );
    }
    const unitPrice = p.price;
    total += unitPrice * line.quantity;
    items.push({
      plantId: p._id,
      title: p.name,
      quantity: line.quantity,
      unitPrice,
    });
  }

  if (!items.length) {
    return NextResponse.json({ error: "No valid line items" }, { status: 400 });
  }

  const order = await Order.create({
    userId: session.user.id,
    items,
    total,
    status: "PENDING_PAYMENT",
    paymentStatus: "UNPAID",
    shippingAddress: parsed.data.shippingAddress,
    tracking: [{ status: "PENDING_PAYMENT", at: new Date() }],
  });

  return NextResponse.json(order);
}
