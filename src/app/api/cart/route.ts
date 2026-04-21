import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Plant from "@/models/Plant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const itemSchema = z.object({
  plantId: z.string(),
  quantity: z.number().int().min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const cart = await Cart.findOne({ userId: session.user.id }).lean();
  if (!cart?.items?.length) return NextResponse.json({ items: [] });

  const ids = cart.items.map((i) => i.plantId);
  const plants = await Plant.find({ _id: { $in: ids } }).lean();
  const map = new Map(plants.map((p) => [p._id.toString(), p]));

  const items = cart.items
    .map((i) => {
      const p = map.get(i.plantId.toString());
      if (!p) return null;
      return {
        plantId: p._id.toString(),
        name: p.name,
        price: p.price,
        imageUrls: p.imageUrls,
        quantity: i.quantity,
        stock: p.stock,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json();
  const parsed = itemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  await connectDB();
  const plant = await Plant.findById(parsed.data.plantId);
  if (!plant || !plant.active) {
    return NextResponse.json({ error: "Plant not available" }, { status: 400 });
  }

  let cart = await Cart.findOne({ userId: session.user.id });
  if (!cart) {
    cart = await Cart.create({ userId: session.user.id, items: [] });
  }

  const existing = cart.items.find(
    (i) => i.plantId.toString() === parsed.data.plantId
  );
  if (existing) existing.quantity += parsed.data.quantity;
  else
    cart.items.push({
      plantId: plant._id,
      quantity: parsed.data.quantity,
    });

  await cart.save();
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json();
  const parsed = z.array(itemSchema).safeParse(json.items);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectDB();
  await Cart.findOneAndUpdate(
    { userId: session.user.id },
    { items: parsed.data.map((i) => ({ plantId: i.plantId, quantity: i.quantity })) },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const plantId = searchParams.get("plantId");

  await connectDB();
  const cart = await Cart.findOne({ userId: session.user.id });
  if (!cart) return NextResponse.json({ ok: true });

  if (plantId) {
    cart.items = cart.items.filter((i) => i.plantId.toString() !== plantId);
  } else {
    cart.items = [];
  }
  await cart.save();
  return NextResponse.json({ ok: true });
}