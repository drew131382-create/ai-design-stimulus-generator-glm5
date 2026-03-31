import LoadingDots from "./LoadingDots";

const REQUIRED_FIELDS = [
  {
    key: "product",
    label: "产品（product）*",
    placeholder: "例如：适老化智能药盒",
    component: "input"
  }
];

const OPTIONAL_FIELDS = [
  {
    key: "user",
    label: "用户（user）",
    placeholder: "例如：独居高龄老人",
    component: "input"
  },
  {
    key: "scenario",
    label: "场景（scenario）",
    placeholder: "例如：早晚服药前，用户需要快速确认药盒状态并获得提醒。",
    component: "input"
  },
  {
    key: "goal",
    label: "目标（goal）",
    placeholder: "例如：降低漏服误服风险，并减少家属远程管理压力。",
    component: "textarea"
  },
  {
    key: "constraints",
    label: "约束（constraints）",
    placeholder: "例如：低成本、操作简单、支持离线提醒",
    component: "textarea"
  }
];

function Field({ field, value, error, onFieldChange, loading }) {
  const commonClassName =
    "w-full rounded-2xl border px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4";

  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {field.label}
      </span>

      {field.component === "textarea" ? (
        <textarea
          rows={3}
          value={value}
          onChange={(event) => onFieldChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          className={`${commonClassName} resize-y ${
            error
              ? "border-rose-300 bg-rose-50/70 focus:border-rose-300 focus:ring-rose-100"
              : "border-slate-200 bg-slate-50/80 focus:border-slate-300 focus:ring-slate-200/60"
          }`}
          disabled={loading}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onFieldChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          className={`${commonClassName} ${
            error
              ? "border-rose-300 bg-rose-50/70 focus:border-rose-300 focus:ring-rose-100"
              : "border-slate-200 bg-slate-50/80 focus:border-slate-300 focus:ring-slate-200/60"
          }`}
          disabled={loading}
        />
      )}

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </label>
  );
}

export default function PromptComposer({
  form,
  errors,
  onFieldChange,
  onGenerate,
  loading,
  hasResult
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-panel backdrop-blur md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">设计任务输入</h2>
            <span className="text-xs font-medium text-slate-500">轻量模式</span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            仅 product 为必填，user 和 scenario 已调整为可选字段。
          </p>
          <p className="text-xs leading-5 text-slate-500">
            注：语义距离基于 ZHIPU 的 Embedding 模型计算。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          {REQUIRED_FIELDS.map((field) => (
            <div key={field.key}>
              <Field
                field={field}
                value={form[field.key] || ""}
                error={errors[field.key]}
                onFieldChange={onFieldChange}
                loading={loading}
              />
            </div>
          ))}
        </div>

        <details className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            可选字段
          </summary>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {OPTIONAL_FIELDS.map((field) => (
              <div
                key={field.key}
                className={field.component === "textarea" ? "md:col-span-2" : ""}
              >
                <Field
                  field={field}
                  value={form[field.key] || ""}
                  error={errors[field.key]}
                  onFieldChange={onFieldChange}
                  loading={loading}
                />
              </div>
            ))}
          </div>
        </details>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            将返回 near / medium / far 三组刺激词及语义距离信息。
            {loading ? (
              <span className="ml-2 inline-flex items-center gap-2 text-slate-600">
                处理中
                <LoadingDots />
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasResult ? (
              <button
                type="button"
                onClick={onGenerate}
                disabled={loading}
                className="inline-flex min-w-[132px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="spinner-ring" />
                    重新生成中
                  </span>
                ) : (
                  "重新生成"
                )}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex min-w-[132px] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner-ring border-white/90 border-t-transparent" />
                  生成中
                </span>
              ) : (
                "生成刺激词"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
