import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlantsPage() {
  await connectDB();
  const plants = await Plant.find({ active: true }).sort({ createdAt: -1 }).limit(48).lean();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-emerald-950">Marketplace</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">
        Every listing includes a glTF model for AR. Tap through to analyze sunlight and climate
        fit for your exact coordinates.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((p) => (
          <Link
            key={p._id.toString()}
            href={`/plants/${p._id.toString()}`}
            className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-emerald-50">
              {p.imageUrls[0] ? (
                <Image
                  src={p.imageUrls[0]}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  No image
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-emerald-950 group-hover:text-emerald-700">
                {p.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{p.description}</p>
              <p className="mt-3 text-lg font-semibold text-emerald-800">
                ${p.price.toFixed(2)}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {plants.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-emerald-200 bg-white p-6 text-zinc-600">
          No plants yet. Run the seed endpoint (see README) to load demo inventory.
        </p>
      ) : null}
    </main>
  );
}
