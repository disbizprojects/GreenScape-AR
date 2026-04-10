import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  await connectDB();
  const filter: Record<string, unknown> = { active: true };
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const plants = await Plant.find(filter).sort({ createdAt: -1 }).limit(60).lean();
  return NextResponse.json(plants);
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  description: z.string().trim().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().positive("Price must be greater than 0."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  imageUrls: z
    .array(
      z
        .string()
        .trim()
        .refine(isHttpUrl, "Each image URL must be a valid http(s) address.")
    )
    .min(1, "At least one cover image URL is required."),
  modelUrl: z
    .string()
    .trim()
    .refine(isHttpUrl, "Model URL must be a valid http(s) address."),
  sunlightRequirement: z.enum(["FULL_SUN", "PARTIAL_SHADE", "FULL_SHADE"]),
  tempMinC: z.coerce.number(),
  tempMaxC: z.coerce.number(),
  idealHumidityPct: z.coerce.number().min(0).max(100),
  waterFrequencyDays: z.coerce.number().int().min(1),
  growthScalePerYear: z.coerce.number().optional(),
  category: z.string().trim().min(1),
  co2KgPerYearEstimate: z.coerce.number().optional(),
  careTips: z.string().optional(),
});

function formatZodIssues(err: z.ZodError): string {
  return err.issues.map((i) => i.message).join(" ");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  await connectDB();
  const base = slugify(parsed.data.name);
  let slug = base;
  let n = 1;
  while (await Plant.findOne({ slug })) {
    slug = `${base}-${n++}`;
  }

  const vendorId =
    session.user.role === "ADMIN"
      ? (json.vendorId as string | undefined) ?? session.user.id
      : session.user.id;

  const plant = await Plant.create({
    ...parsed.data,
    slug,
    vendorId,
    active: true,
  });

  return NextResponse.json(plant);
}
