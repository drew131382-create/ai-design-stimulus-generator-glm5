import { cn } from "../lib/cn";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hasDistanceData(item) {
  return typeof item.semantic_distance_score === "number";
}

export default function StimulusCard({
  item,
  index,
  selected,
  group,
  onClick
}) {
  const hasDistance = hasDistanceData(item);
  const score = hasDistance ? clamp(item.semantic_distance_score, 0, 100) : 0;

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
        <div className="flex items-start justify-between gap-3">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            {item.word}
          </span>
          <span
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold",
              group.badgeClass
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {item.explanation || item.inspiration}
        </p>

        <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/70 p-3">
          {hasDistance ? (
            <>
              <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                <span>语义距离：{score}/100</span>
                <span className="font-medium text-slate-700">
                  {item.semantic_distance_level || "未知"}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-800 transition-all duration-300"
                  style={{ width: `${score}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">暂无距离数据</p>
          )}
        </div>
      </div>
    </button>
  );
}
