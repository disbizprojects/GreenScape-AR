import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  secret: z.string(),
});

/**
 * Create or update an admin account
 * Requires ADMIN_CREATION_SECRET header for security
 * 
 * POST /api/admin/create
 * Body: { email, password, name?, secret }
 */
export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify the creation secret
  if (parsed.data.secret !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { email, password, name } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  let admin = await User.findOne({ email });
  
  if (admin) {
    // Update existing admin
    admin.passwordHash = passwordHash;
    if (name) admin.name = name;
    admin.role = "ADMIN";
    await admin.save();
    return NextResponse.json({
      ok: true,
      message: "Admin account updated",
      email: admin.email,
      name: admin.name,
    });
  }

  // Create new admin
  admin = await User.create({
    email,
    passwordHash,
    name: name || "Admin",
    role: "ADMIN",
  });

  return NextResponse.json({
    ok: true,
    message: "Admin account created",
    email: admin.email,
    name: admin.name,
    note: "Use these credentials to log in",
  });
}
