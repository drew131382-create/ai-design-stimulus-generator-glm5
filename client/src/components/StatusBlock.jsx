import { STIMULUS_GROUPS } from "../lib/categories";
import LoadingDots from "./LoadingDots";

function SkeletonColumn({ group }) {
  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white/75 p-5 shadow-panel">
      <div className="h-6 w-24 rounded-full skeleton-shimmer" />
      <div className="mt-4 h-8 w-40 rounded-xl skeleton-shimmer" />
      <div className="mt-3 h-4 w-48 rounded-lg skeleton-shimmer" />

      <div className="mt-6 grid gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`${group.key}-${index}`}
            className="rounded-2xl border border-slate-200/90 bg-white p-4"
          >
            <div className="h-5 w-24 rounded-lg skeleton-shimmer" />
            <div className="mt-3 h-4 w-full rounded-lg skeleton-shimmer" />
            <div className="mt-2 h-4 w-2/3 rounded-lg skeleton-shimmer" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatusBlock({ type, message, hint }) {
  if (type === "loading") {
    return (
      <div className="space-y-5">
        <section className="rounded-[26px] border border-slate-200/80 bg-white/80 p-5 shadow-panel backdrop-blur md:p-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1.5 text-sm font-medium text-slate-700">
              <span className="spinner-ring" />
              {message || "正在生成刺激词"}
              <LoadingDots />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {hint || "正在补充语义距离并整理结构化结果，请稍候。"}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
              <div className="loading-progress h-full rounded-full bg-slate-500/80" />
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          {STIMULUS_GROUPS.map((group) => (
            <SkeletonColumn key={group.key} group={group} />
          ))}
        </div>

        <section className="rounded-[28px] border border-slate-200/80 bg-white/78 p-6 shadow-panel md:p-8">
          <div className="h-5 w-28 rounded-lg skeleton-shimmer" />
          <div className="mt-4 h-10 w-56 rounded-xl skeleton-shimmer" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-5">
              <div className="h-4 w-24 rounded-lg skeleton-shimmer" />
              <div className="mt-4 h-4 w-full rounded-lg skeleton-shimmer" />
              <div className="mt-2 h-4 w-4/5 rounded-lg skeleton-shimmer" />
              <div className="mt-2 h-4 w-2/3 rounded-lg skeleton-shimmer" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-5">
              <div className="h-4 w-20 rounded-lg skeleton-shimmer" />
              <div className="mt-4 h-4 w-full rounded-lg skeleton-shimmer" />
              <div className="mt-2 h-4 w-3/4 rounded-lg skeleton-shimmer" />
              <div className="mt-2 h-4 w-1/2 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </section>
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
