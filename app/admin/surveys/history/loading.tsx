export default function AdminSurveyHistoryLoading() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,220px,auto]">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-11/12 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-10/12 animate-pulse rounded bg-slate-100" />
      </div>
    </section>
  );
}
