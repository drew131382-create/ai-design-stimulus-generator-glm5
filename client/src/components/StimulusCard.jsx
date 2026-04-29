import { cn } from "../lib/cn";

export default function StimulusCard({ item, selected, group, onClick }) {
  const dimension = item.designDimension || "未标注";
  const distance = item.semanticDistance || group.shortTitle;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:opacity-0 before:transition before:duration-200",
        "hover:-translate-y-0.5 hover:bg-white",
        group.panelClass,
        group.hoverClass,
        selected && cn(group.activeClass, "before:opacity-100")
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition duration-200",
          group.glowClass,
          selected && "opacity-100"
        )}
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            {item.word}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {distance}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {dimension}
          </span>
        </div>

        {item.reason ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
            {item.reason}
          </p>
        ) : null}
      </div>
    </button>
  );
}
