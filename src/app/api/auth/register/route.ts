import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    becomeVendor: z.boolean().optional(),
    businessName: z.string().optional(),
    becomeAdmin: z.boolean().optional(),
    adminSecret: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.becomeAdmin && data.becomeVendor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose either vendor or admin registration.",
        path: ["becomeAdmin"],
      });
    }

    if (data.becomeVendor) {
      const bn = data.businessName?.trim() ?? "";
      if (bn.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business name is required for nursery vendors.",
          path: ["businessName"],
        });
      }
    }

    if (data.becomeAdmin) {
      const adminSecret = data.adminSecret?.trim() ?? "";
      if (adminSecret.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Admin secret is required for admin registration.",
          path: ["adminSecret"],
        });
      }
    }
  });

function formatZodError(err: z.ZodError): string {
  return err.issues.map((e) => e.message).join(" ");
}

function messageFromUnknownError(err: unknown): string {
  if (err instanceof z.ZodError) return formatZodError(err);

  if (err instanceof Error) {
    if (err.message.includes("MONGODB_URI")) {
      return "Server configuration error: MONGODB_URI is not set. Add it to .env.local.";
    }
  }

  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: number }).code;
    if (code === 11000) return "Email already registered.";
  }

  const msg = err instanceof Error ? err.message : String(err);

  if (
    /ECONNREFUSED|ENOTFOUND|MongoNetworkError|Server selection timed out|querySrv|getaddrinfo/i.test(
      msg
    )
  ) {
    return "Cannot connect to MongoDB. Start MongoDB locally or fix MONGODB_URI in .env.local (e.g. Atlas connection string).";
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors)[0];
    if (first?.message) return first.message;
  }

  return msg || "Registration failed.";
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { email, password, name, becomeVendor, businessName, becomeAdmin, adminSecret } = parsed.data;

  try {
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    if (becomeAdmin) {
      const configuredSecret = process.env.ADMIN_REGISTER_SECRET?.trim();
      if (!configuredSecret) {
        return NextResponse.json(
          { error: "Admin registration is not configured on this server." },
          { status: 500 }
        );
      }

      if (adminSecret?.trim() !== configuredSecret) {
        return NextResponse.json({ error: "Invalid admin secret." }, { status: 403 });
      }
    }

    const role = becomeAdmin ? "ADMIN" : becomeVendor ? "VENDOR" : "CUSTOMER";

    const trimmedBusiness = businessName?.trim();

    const doc = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      vendorProfile:
        becomeVendor && trimmedBusiness
          ? {
              businessName: trimmedBusiness,
              verified: false,
              submittedAt: new Date(),
              description: "",
            }
          : undefined,
    });

    return NextResponse.json({
      id: doc._id.toString(),
      email: doc.email,
      role: doc.role,
    });
  } catch (err) {
    console.error("[register]", err);
    const message = messageFromUnknownError(err);
    const status =
      message.includes("already registered") || message.includes("11000") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
