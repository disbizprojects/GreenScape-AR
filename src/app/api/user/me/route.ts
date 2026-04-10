import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const user = await User.findById(session.user.id)
    .select("-passwordHash")
    .lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  addresses: z
    .array(
      z.object({
        label: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        postalCode: z.string(),
        country: z.string(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
    )
    .optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.name) user.name = parsed.data.name;
  if (parsed.data.addresses) user.addresses = parsed.data.addresses;
  await user.save();

  return NextResponse.json({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    addresses: user.addresses,
  });
}
