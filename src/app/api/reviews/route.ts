import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import Review from "@/models/Review";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get("plantId");
  if (!plantId) {
    return NextResponse.json({ error: "plantId required" }, { status: 400 });
  }
  await connectDB();
  const reviews = await Review.find({ plantId }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json(reviews);
}

const postSchema = z.object({
  plantId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  await connectDB();
  const plant = await Plant.findById(parsed.data.plantId);
  if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

  const purchased = await Order.findOne({
    userId: session.user.id,
    paymentStatus: "PAID",
    "items.plantId": plant._id,
  }).lean();

  if (!purchased) {
    return NextResponse.json(
      { error: "You can review after purchasing this plant." },
      { status: 403 }
    );
  }

  try {
    const review = await Review.create({
      userId: session.user.id,
      plantId: plant._id,
      vendorId: plant.vendorId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      photoUrls: parsed.data.photoUrls ?? [],
    });
    return NextResponse.json(review);
  } catch {
    return NextResponse.json(
      { error: "You already reviewed this plant." },
      { status: 409 }
    );
  }
}
