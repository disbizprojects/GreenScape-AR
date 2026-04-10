import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const role = session.user.role;

  if (role === "ADMIN") {
    const [users, plants, orders, revenue] = await Promise.all([
      User.countDocuments(),
      Plant.countDocuments({ active: true }),
      Order.countDocuments({ paymentStatus: "PAID" }),
      Order.aggregate<{ _id: null; total: number }>([
        { $match: { paymentStatus: "PAID" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);
    return NextResponse.json({
      role: "ADMIN",
      users,
      activePlants: plants,
      paidOrders: orders,
      revenue: revenue[0]?.total ?? 0,
    });
  }

  if (role === "VENDOR") {
    const mine = await Plant.find({ vendorId: session.user.id }).select("_id name co2KgPerYearEstimate");
    const ids = mine.map((p) => p._id);
    const orders = await Order.find({
      paymentStatus: "PAID",
      "items.plantId": { $in: ids },
    }).lean();

    let units = 0;
    const byPlant: Record<string, number> = {};
    for (const o of orders) {
      for (const it of o.items) {
        if (!ids.some((id) => id.equals(it.plantId))) continue;
        units += it.quantity;
        const k = it.plantId.toString();
        byPlant[k] = (byPlant[k] ?? 0) + it.quantity;
      }
    }

    return NextResponse.json({
      role: "VENDOR",
      totalUnitsSold: units,
      topPlants: mine
        .map((p) => ({
          name: p.name,
          sold: byPlant[p._id.toString()] ?? 0,
        }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 8),
    });
  }

  const user = await User.findById(session.user.id).lean();
  const orders = await Order.find({
    userId: session.user.id,
    paymentStatus: "PAID",
  }).lean();

  let plantsPurchased = 0;
  let co2 = 0;
  let waterLitersEstimate = 0;

  for (const o of orders) {
    for (const it of o.items) {
      plantsPurchased += it.quantity;
      const p = await Plant.findById(it.plantId).lean();
      if (p) {
        co2 += p.co2KgPerYearEstimate * it.quantity;
        waterLitersEstimate += p.waterFrequencyDays > 0 ? (365 / p.waterFrequencyDays) * 0.5 * it.quantity : 0;
      }
    }
  }

  const survivalHint =
    user?.carePlans?.length && orders.length
      ? "Track watering in your care plans to improve outcomes."
      : "Purchase a plant to unlock personalized survival insights.";

  return NextResponse.json({
    role: "CUSTOMER",
    plantsPurchased,
    estimatedCo2KgPerYear: Math.round(co2 * 10) / 10,
    waterLitersEstimateYear: Math.round(waterLitersEstimate),
    carePlans: user?.carePlans?.length ?? 0,
    survivalHint,
  });
}
