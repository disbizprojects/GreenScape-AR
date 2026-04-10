import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!stripeEnabled() || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local." },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = (await req.json()) as { orderId?: string };
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order || order.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: order.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(i.unitPrice * 100),
        product_data: { name: i.title },
      },
    })),
    success_url: `${origin}/orders/${order._id.toString()}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: { orderId: order._id.toString() },
  });

  order.stripeSessionId = stripeSession.id;
  await order.save();

  return NextResponse.json({ url: stripeSession.url });
}

/** Create order from cart + return checkout URL in one step */
export async function PUT(req: Request) {
  if (!stripeEnabled() || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shippingAddress } = (await req.json()) as {
    shippingAddress?: Record<string, unknown>;
  };
  if (!shippingAddress) {
    return NextResponse.json({ error: "shippingAddress required" }, { status: 400 });
  }

  const { default: Plant } = await import("@/models/Plant");
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
    total += p.price * line.quantity;
    items.push({
      plantId: p._id,
      title: p.name,
      quantity: line.quantity,
      unitPrice: p.price,
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
    shippingAddress,
    tracking: [{ status: "PENDING_PAYMENT", at: new Date() }],
  });

  const origin = new URL(req.url).origin;
  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: order.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(i.unitPrice * 100),
        product_data: { name: i.title },
      },
    })),
    success_url: `${origin}/orders/${order._id.toString()}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: { orderId: order._id.toString() },
  });

  order.stripeSessionId = stripeSession.id;
  await order.save();

  cart.items = [];
  await cart.save();

  return NextResponse.json({ url: stripeSession.url, orderId: order._id.toString() });
}
