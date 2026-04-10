import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              AR · Weather · Sustainable gardening
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-emerald-950 md:text-5xl">
              Place real-scale plants in your space before you buy.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600">
              GreenScape AR combines WebXR-powered visualization with sunlight heuristics,
              free Open-Meteo weather data, and OpenStreetMap location picking — so you can
              plan balconies, rooftops, and indoor corners with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/plants"
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Browse plants
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                Create account
              </Link>
            </div>
            <ul className="mt-10 grid gap-3 text-sm text-zinc-600">
              <li>● AR preview with Scene Viewer / WebXR on supported phones</li>
              <li>● Sunlight compatibility & survival heuristics for your pin</li>
              <li>● Smart watering suggestions with rain-aware adjustments</li>
              <li>● Disease scan (mock or Plant.id API key)</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm">
            <div className="aspect-[4/3] rounded-2xl bg-[url('https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&q=80')] bg-cover bg-center" />
            <p className="mt-4 text-sm text-zinc-600">
              Tip: on Android Chrome, tap “View in your space” in the AR experience. iOS
              uses AR Quick Look where available.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
