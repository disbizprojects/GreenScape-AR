import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const DEMO_MODELS = [
  "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
];

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  "https://images.unsplash.com/photo-1501004318641-b39ac645fff6?w=800&q=80",
];

export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers.get("x-seed-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@greenscape.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Demo12345!";
  const deployAdminEmail = process.env.DEPLOY_ADMIN_EMAIL ?? "admin@gs.com";
  const deployAdminPassword = process.env.DEPLOY_ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const deployAdminPasswordHash = await bcrypt.hash(deployAdminPassword, 12);

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      email: adminEmail,
      passwordHash,
      name: "GreenScape Admin",
      role: "ADMIN",
    });
  }

  let deployAdmin = await User.findOne({ email: deployAdminEmail });
  if (!deployAdmin) {
    deployAdmin = await User.create({
      email: deployAdminEmail,
      passwordHash: deployAdminPasswordHash,
      name: "GreenScape Deployment Admin",
      role: "ADMIN",
    });
  } else {
    deployAdmin.passwordHash = deployAdminPasswordHash;
    deployAdmin.role = "ADMIN";
    await deployAdmin.save();
  }

  let vendor = await User.findOne({ email: "vendor@greenscape.local" });
  if (!vendor) {
    vendor = await User.create({
      email: "vendor@greenscape.local",
      passwordHash,
      name: "Urban Roots Nursery",
      role: "VENDOR",
      vendorProfile: {
        businessName: "Urban Roots Nursery",
        verified: true,
        submittedAt: new Date(),
        description: "Verified partner nursery (seed data).",
      },
    });
  }

  const customer = await User.findOne({ email: "customer@greenscape.local" });
  if (!customer) {
    await User.create({
      email: "customer@greenscape.local",
      passwordHash,
      name: "Demo Customer",
      role: "CUSTOMER",
    });
  }

  const samples = [
    {
      name: "Monstera Deliciosa",
      slug: "monstera-deliciosa",
      description:
        "Large fenestrated leaves — a classic indoor statement plant. Likes bright, indirect light.",
      price: 42,
      stock: 24,
      sunlightRequirement: "PARTIAL_SHADE" as const,
      tempMinC: 16,
      tempMaxC: 30,
      idealHumidityPct: 60,
      waterFrequencyDays: 7,
      category: "Indoor tropical",
      growthScalePerYear: 0.12,
      co2KgPerYearEstimate: 6,
    },
    {
      name: "Cherry Tomato (Patio)",
      slug: "cherry-tomato-patio",
      description: "Compact edible for balconies — needs strong sun and regular water.",
      price: 18,
      stock: 60,
      sunlightRequirement: "FULL_SUN" as const,
      tempMinC: 12,
      tempMaxC: 35,
      idealHumidityPct: 55,
      waterFrequencyDays: 2,
      category: "Edible",
      growthScalePerYear: 0.2,
      co2KgPerYearEstimate: 4,
    },
    {
      name: "Snake Plant",
      slug: "snake-plant",
      description: "Very forgiving; excellent for low-light rooms.",
      price: 26,
      stock: 40,
      sunlightRequirement: "FULL_SHADE" as const,
      tempMinC: 10,
      tempMaxC: 32,
      idealHumidityPct: 45,
      waterFrequencyDays: 14,
      category: "Low maintenance",
      growthScalePerYear: 0.05,
      co2KgPerYearEstimate: 3,
    },
  ];

  const created: string[] = [];
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const exists = await Plant.findOne({ slug: s.slug });
    if (exists) continue;
    await Plant.create({
      ...s,
      imageUrls: [DEMO_IMAGES[i % DEMO_IMAGES.length]],
      modelUrl: DEMO_MODELS[i % DEMO_MODELS.length],
      vendorId: vendor!._id,
      active: true,
      careTips: "Rotate the pot weekly for even growth. Wipe leaves to remove dust.",
    });
    created.push(s.slug);
  }

  return NextResponse.json({
    ok: true,
    adminEmail,
    deployAdminEmail,
    vendorEmail: "vendor@greenscape.local",
    customerEmail: "customer@greenscape.local",
    password: adminPassword,
    deployAdminPassword,
    plantsCreated: created,
  });
}
