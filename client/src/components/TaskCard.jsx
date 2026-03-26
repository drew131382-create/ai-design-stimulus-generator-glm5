function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function renderValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join("，") : "未填写";
  }

  if (hasText(value)) {
    return value.trim();
  }

  return "未填写";
}

const KEY_FIELDS = [
  { key: "product", label: "产品" },
  { key: "user", label: "用户" },
  { key: "scenario", label: "场景" }
];

const OPTIONAL_FIELDS = [
  { key: "goal", label: "目标" },
  { key: "constraints", label: "约束" },
  { key: "styleTags", label: "风格标签", isArray: true },
  { key: "emotionTags", label: "情绪标签", isArray: true },
  { key: "notes", label: "补充说明" },
  { key: "existingIdeas", label: "已有想法" },
  { key: "avoidDirections", label: "避免方向" }
];

export default function TaskCard({ task }) {
  if (!task) {
    return null;
  }

  const visibleOptional = OPTIONAL_FIELDS.filter((field) => {
    const value = task[field.key];

    if (field.isArray) {
      return Array.isArray(value) && value.length > 0;
    }

    return hasText(value);
  });

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/85 p-5 shadow-panel backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-900">任务卡</h3>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          关键信息
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {KEY_FIELDS.map((field) => (
          <article
            key={field.key}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {field.label}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {renderValue(task[field.key])}
            </p>
          </article>
        ))}
      </div>

      {visibleOptional.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visibleOptional.map((field) => (
            <article
              key={field.key}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {field.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {renderValue(task[field.key])}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
