export default function SurveyReportingLoading() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-6 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </section>
  );
}
