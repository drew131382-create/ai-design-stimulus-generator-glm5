import StimulusCard from "./StimulusCard";
import { cn } from "../lib/cn";

export default function StimulusColumn({
  group,
  items,
  selection,
  onSelect
}) {
  return (
    <section
      className={cn(
        "rounded-[26px] border p-5 shadow-panel backdrop-blur md:p-6",
        group.panelClass
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
              group.badgeClass
            )}
          >
            {group.shortTitle}
          </span>
        </div>

        <div className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-medium text-slate-500">
          {items.length} 项
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        {items.map((item, index) => (
          <StimulusCard
            key={`${group.key}-${item.word}-${index}`}
            item={item}
            index={index}
            group={group}
            selected={
              selection?.group === group.key && selection?.index === index
            }
            onClick={() => onSelect(group.key, index, item)}
          />
        ))}
      </div>
    </section>
  );
}
