import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const vendors = await User.find({ role: "VENDOR" })
    .select("name email vendorProfile createdAt")
    .lean();

  return NextResponse.json(vendors);
}

const patchSchema = z.object({
  userId: z.string(),
  verified: z.boolean(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(parsed.data.userId);
  if (!user || user.role !== "VENDOR" || !user.vendorProfile) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  user.vendorProfile.verified = parsed.data.verified;
  await user.save();

  return NextResponse.json({ ok: true, vendorProfile: user.vendorProfile });
}
