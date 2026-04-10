import connectDB from "@/lib/mongodb";
import Plant from "@/models/Plant";
import { notFound } from "next/navigation";
import { ArClient } from "./ArClient";

type Props = { params: Promise<{ plantId: string }> };

export default async function ArPage({ params }: Props) {
  const { plantId } = await params;
  await connectDB();
  const plant = await Plant.findById(plantId).lean();
  if (!plant) notFound();

  const plain = JSON.parse(JSON.stringify(plant));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <ArClient plant={plain} />
    </main>
  );
}
