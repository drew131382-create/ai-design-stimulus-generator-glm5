import { GROUP_MAP } from "../lib/categories";
import { cn } from "../lib/cn";

function formatSemanticDistance(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "暂无距离数据";
  }

  return String(value);
}

export default function DetailPanel({ selection, selectedItem }) {
  if (!selection || !selectedItem) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-panel">
        <p className="text-base font-medium text-slate-700">
          生成后点击任意刺激词，即可在这里查看详细内容。
        </p>
      </section>
    );
  }

  const group = GROUP_MAP[selection.group];

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/85 p-6 shadow-panel backdrop-blur md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                group.badgeClass
              )}
            >
              {group.title}
            </span>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {selectedItem.word}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            当前分类：{group.shortTitle}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/85 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              解释说明
            </p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {selectedItem.explanation || selectedItem.inspiration}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/85 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              设计方向
            </p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {selectedItem.direction || selectedItem.explanation}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/85 p-5 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              语义距离
            </p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {formatSemanticDistance(selectedItem.semantic_distance)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              注：语义距离基于 ZHIPU 的 Embedding 模型计算。
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
