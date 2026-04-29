import { STIMULUS_GROUPS } from "../lib/categories";

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getTaskTitle(task) {
  return task?.product || task?.prompt || "未命名任务";
}

function getTaskMeta(task) {
  return [task?.user, task?.scenario, task?.goal]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" / ");
}

function collectPreviewWords(result) {
  const words = [];

  for (const group of STIMULUS_GROUPS) {
    const items = Array.isArray(result?.[group.key]) ? result[group.key] : [];

    for (const item of items) {
      if (item?.word) {
        words.push(item.word);
      }

      if (words.length >= 6) {
        return words;
      }
    }
  }

  return words;
}

export default function HistoryPanel({ records, activeRecordId, onOpenRecord }) {
  const hasRecords = Array.isArray(records) && records.length > 0;

  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-panel backdrop-blur md:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-950">
            生成历史
          </h2>
          <p className="mt-2 text-[14px] leading-7 text-slate-600">
            历史仅用于回看旧结果和减少新一轮重复词，不会覆盖当前正在编辑或已生成的内容。
          </p>
        </div>

        <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          {hasRecords ? `${records.length} 条记录` : "暂无记录"}
        </span>
      </div>

      {!hasRecords ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            生成一次刺激词后，这里会保存输入、时间和完整结果。
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            刷新页面后仍可回看，也会自动参与下一次去重。
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {records.map((record) => {
            const active = activeRecordId === record.id;
            const previewWords = collectPreviewWords(record.result);
            const meta = getTaskMeta(record.task);

            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onOpenRecord(record)}
                className={`rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-panel ${
                  active
                    ? "border-slate-900 bg-slate-50 ring-2 ring-slate-200"
                    : "border-slate-200 bg-white/85 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {getTaskTitle(record.task)}
                    </p>
                    {meta ? (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {meta}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    {formatDateTime(record.createdAt)}
                  </span>
                </div>

                {previewWords.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {previewWords.map((word) => (
                      <span
                        key={`${record.id}-${word}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

