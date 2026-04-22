import connectDB from "@/lib/mongodb";
import { sendPaymentReceiptEmail } from "@/lib/email";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import User from "@/models/User";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await connectDB();
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== "PAID") {
        order.paymentStatus = "PAID";
        order.status = "ORDER_CONFIRMED";
        order.tracking.push({ status: "ORDER_CONFIRMED", at: new Date() });
        for (const item of order.items) {
          await Plant.updateOne(
            { _id: item.plantId },
            { $inc: { stock: -item.quantity } }
          );
        }
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
            console.error("Stripe receipt email failed:", error);
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
