import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listMediaAssets } from "@/lib/workout-data";

export default async function MediaPage() {
  const mediaAssets = await listMediaAssets();

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <header className="mt-6 border-b border-stone-200 pb-6">
          <h1 className="text-4xl font-semibold">Media library</h1>
          <p className="mt-2 text-stone-600">
            Seeded assets today. Mux direct upload can slot in here later.
          </p>
        </header>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mediaAssets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-md border border-stone-200 bg-white"
            >
              <Image
                src={asset.thumbnailUrl}
                alt=""
                width={640}
                height={360}
                className="aspect-video w-full object-cover"
              />
              <div className="p-4">
                <h2 className="font-semibold">{asset.title}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {asset.durationSeconds}s
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
