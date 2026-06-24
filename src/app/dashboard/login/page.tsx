import { LockKeyhole } from "lucide-react";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function DashboardLoginPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const next = query.next?.startsWith("/dashboard") ? query.next : "/dashboard";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 px-6 text-stone-950">
      <section className="w-full max-w-sm rounded-md border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-stone-950 text-white">
          <LockKeyhole size={20} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Dashboard access</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Enter the shared Seasons dashboard password.
        </p>

        <form action="/api/dashboard/login" method="post" className="mt-6">
          <input type="hidden" name="next" value={next} />
          <label
            htmlFor="password"
            className="text-sm font-medium text-stone-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            className="mt-2 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
          />
          {query.error ? (
            <p className="mt-3 text-sm font-medium text-red-600">
              That password did not match.
            </p>
          ) : null}
          <button className="mt-5 h-11 w-full rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800">
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
