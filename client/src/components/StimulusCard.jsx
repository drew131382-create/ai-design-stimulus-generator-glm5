import { cn } from "../lib/cn";

export default function StimulusCard({
  item,
  index,
  selected,
  group,
  onClick
}) {
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
          {item.inspiration}
        </p>
      </div>
    </button>
  );
}

