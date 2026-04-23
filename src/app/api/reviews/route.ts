import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Plant from "@/models/Plant";
import Review from "@/models/Review";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get("plantId");
  const includeMeta = searchParams.get("includeMeta") === "1";
  if (!plantId) {
    return NextResponse.json({ error: "plantId required" }, { status: 400 });
  }

  await connectDB();
  const reviews = await Review.find({ plantId })
    .populate({ path: "userId", model: User, select: "name" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const formattedReviews = reviews.map((review) => ({
    _id: review._id.toString(),
    rating: review.rating,
    comment: review.comment ?? "",
    photoUrls: review.photoUrls ?? [],
    createdAt: review.createdAt,
    user: {
      id: review.userId && typeof review.userId === "object" && "_id" in review.userId
        ? String(review.userId._id)
        : String(review.userId),
      name:
        review.userId && typeof review.userId === "object" && "name" in review.userId
          ? String(review.userId.name ?? "Anonymous")
          : "Anonymous",
    },
  }));

  if (!includeMeta) {
    return NextResponse.json(formattedReviews);
  }

  const session = await getServerSession(authOptions);
  let hasPurchased = false;
  let hasReviewed = false;

  if (session?.user?.id) {
    const [purchaseDoc, reviewDoc] = await Promise.all([
      Order.findOne({
        userId: session.user.id,
        paymentStatus: "PAID",
        "items.plantId": plantId,
      })
        .select({ _id: 1 })
        .lean(),
      Review.findOne({ userId: session.user.id, plantId })
        .select({ _id: 1 })
        .lean(),
    ]);

    hasPurchased = Boolean(purchaseDoc);
    hasReviewed = Boolean(reviewDoc);
  }

  const ratingTotal = formattedReviews.reduce((acc, review) => acc + review.rating, 0);
  const ratingCount = formattedReviews.length;

  return NextResponse.json({
    reviews: formattedReviews,
    stats: {
      count: ratingCount,
      averageRating: ratingCount ? Number((ratingTotal / ratingCount).toFixed(1)) : 0,
    },
    eligibility: {
      signedIn: Boolean(session?.user?.id),
      hasPurchased,
      hasReviewed,
      canReview: Boolean(session?.user?.id) && hasPurchased && !hasReviewed,
    },
  });
}

const postSchema = z.object({
  plantId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
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

    const hydrated = await review.populate({ path: "userId", model: User, select: "name" });

    return NextResponse.json({
      _id: hydrated._id.toString(),
      rating: hydrated.rating,
      comment: hydrated.comment ?? "",
      photoUrls: hydrated.photoUrls ?? [],
      createdAt: hydrated.createdAt,
      user: {
        id: hydrated.userId && typeof hydrated.userId === "object" && "_id" in hydrated.userId
          ? String(hydrated.userId._id)
          : String(hydrated.userId),
        name:
          hydrated.userId && typeof hydrated.userId === "object" && "name" in hydrated.userId
            ? String(hydrated.userId.name ?? "Anonymous")
            : "Anonymous",
      },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "number" &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "You already reviewed this plant." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Could not save your review. Please try again." },
      { status: 500 }
    );
  }
}
