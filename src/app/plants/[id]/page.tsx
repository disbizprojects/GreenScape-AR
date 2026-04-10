import { AddToCartButton } from "./AddToCartButton";
import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function PlantDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const plant = await Plant.findById(id).lean();
  if (!plant) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-emerald-50">
          {plant.imageUrls[0] ? (
            <Image
              src={plant.imageUrls[0]}
              alt={plant.name}
              fill
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-700">{plant.category}</p>
          <h1 className="mt-2 text-4xl font-semibold text-emerald-950">{plant.name}</h1>
          <p className="mt-4 text-lg text-zinc-600">{plant.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <dt className="text-zinc-500">Sunlight</dt>
              <dd className="font-medium">{plant.sunlightRequirement.replace("_", " ")}</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <dt className="text-zinc-500">Water cadence</dt>
              <dd className="font-medium">Every {plant.waterFrequencyDays} days</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <dt className="text-zinc-500">Temp range</dt>
              <dd className="font-medium">
                {plant.tempMinC}°C – {plant.tempMaxC}°C
              </dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <dt className="text-zinc-500">Humidity</dt>
              <dd className="font-medium">{plant.idealHumidityPct}% ideal</dd>
            </div>
          </dl>
          <p className="mt-6 text-3xl font-semibold text-emerald-800">
            ${plant.price.toFixed(2)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/ar/${plant._id.toString()}`}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Open AR experience
            </Link>
            <AddToCartButton plantId={plant._id.toString()} />
          </div>
          {plant.careTips ? (
            <p className="mt-8 rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-zinc-700">
              <span className="font-semibold text-emerald-900">Care tips: </span>
              {plant.careTips}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
