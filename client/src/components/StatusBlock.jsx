import { STIMULUS_GROUPS } from "../lib/categories";

function SkeletonColumn({ group }) {
  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white/75 p-5 shadow-panel">
      <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-4 h-8 w-40 animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-3 h-4 w-32 animate-pulse rounded-lg bg-slate-100" />

      <div className="mt-6 grid gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`${group.key}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="h-5 w-24 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatusBlock({ type, message }) {
  if (type === "loading") {
    return (
      <div className="grid gap-5 xl:grid-cols-3">
        {STIMULUS_GROUPS.map((group) => (
          <SkeletonColumn key={group.key} group={group} />
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/78 p-8 text-center shadow-panel">
      <p className="text-lg font-semibold text-slate-900">
        {type === "error" ? "生成失败" : "等待输入"}
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        {message}
      </p>
    </section>
  );
}

