import { authOptions } from "@/lib/auth";
import {
  cloudinaryConfigured,
  uploadToCloudinary,
  type UploadKind,
} from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const MAX_COVER_BYTES = 12 * 1024 * 1024;
const MAX_MODEL_BYTES = 45 * 1024 * 1024;

const COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET() {
  return NextResponse.json({ configured: cloudinaryConfigured() });
}

export async function POST(req: Request) {
  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "File upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local.",
      },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const kindRaw = form.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  const kind = kindRaw === "model" ? "model" : kindRaw === "cover" ? "cover" : null;
  if (!kind) {
    return NextResponse.json(
      { error: "kind must be cover or model" },
      { status: 400 }
    );
  }

  const name = file.name.toLowerCase();
  if (kind === "cover") {
    if (!COVER_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Cover must be JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }
    if (file.size > MAX_COVER_BYTES) {
      return NextResponse.json(
        { error: "Cover image must be 12 MB or smaller." },
        { status: 400 }
      );
    }
  } else {
    if (!name.endsWith(".glb")) {
      return NextResponse.json(
        { error: "3D model must be a .glb file." },
        { status: 400 }
      );
    }
    if (file.size > MAX_MODEL_BYTES) {
      return NextResponse.json(
        { error: "Model must be 45 MB or smaller." },
        { status: 400 }
      );
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await uploadToCloudinary(buffer, kind as UploadKind);
    return NextResponse.json({ url, kind });
  } catch (e) {
    console.error("[upload]", e);
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const maxDuration = 120;
