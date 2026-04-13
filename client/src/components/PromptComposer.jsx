import { useState } from "react";
import LoadingDots from "./LoadingDots";

const OPTIONAL_FIELDS = [
  {
    key: "user",
    label: "用户",
    placeholder: "老人"
  },
  {
    key: "scenario",
    label: "场景",
    placeholder: "家庭陪伴"
  },
  {
    key: "goal",
    label: "目标",
    placeholder: "减少孤独感"
  },
  {
    key: "constraints",
    label: "约束条件",
    placeholder: "操作简单"
  }
];

function Field({ label, required = false, error = "", children }) {
  return (
    <label className="block space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-semibold text-slate-600">{label}</span>
        {required ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-600">
            必填
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-500">
            可选
          </span>
        )}
      </div>

      {children}

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </label>
  );
}

export default function PromptComposer({
  taskForm,
  formErrors,
  onFieldChange,
  onGenerate,
  onOpenResult,
  loading,
  hasResult,
  canOpenResult,
  resultButtonLabel = "查看结果"
}) {
  const [showOptional, setShowOptional] = useState(false);

  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-panel backdrop-blur md:p-8">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-950">
            设计任务输入
          </h2>
          <p className="max-w-4xl text-[14px] leading-7 text-slate-600">
            先填写产品，其他信息按需补充。提交后会先进入任务队列，再在弹窗中显示排队和生成状态。
          </p>
          <p className="text-[12px] leading-6 text-slate-500">
            注：语义距离基于 ZHIPU 的 Embedding-3 模型计算。
          </p>
        </div>

        <Field label="产品" required error={formErrors.product}>
          <input
            type="text"
            value={taskForm.product}
            onChange={(event) => onFieldChange("product", event.target.value)}
            placeholder="陪伴机器人"
            className={`w-full rounded-2xl border px-5 py-4 text-[14px] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] outline-none transition duration-200 placeholder:text-[14px] placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
              formErrors.product
                ? "border-rose-300 bg-rose-50/70 focus:border-rose-300 focus:ring-rose-100"
                : "border-slate-300 bg-white focus:border-slate-400 focus:ring-slate-200/70"
            }`}
            disabled={loading}
          />
        </Field>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[18px] font-medium tracking-tight text-slate-900">
                补充更多信息
              </p>
              <p className="mt-2 text-[14px] leading-7 text-slate-500">
                用户、场景、目标、约束条件都可以不填；补充后通常会让方向更贴题。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowOptional((current) => !current)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-[14px] font-medium text-slate-700 transition duration-200 hover:border-slate-400"
            >
              {showOptional ? "收起可选字段" : "展开可选字段"}
            </button>
          </div>

          {showOptional ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {OPTIONAL_FIELDS.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  error={formErrors[field.key]}
                >
                  <input
                    type="text"
                    value={taskForm[field.key]}
                    onChange={(event) =>
                      onFieldChange(field.key, event.target.value)
                    }
                    placeholder={field.placeholder}
                    className={`w-full rounded-2xl border px-4 py-3.5 text-[14px] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] outline-none transition duration-200 placeholder:text-[14px] placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      formErrors[field.key]
                        ? "border-rose-300 bg-rose-50/70 focus:border-rose-300 focus:ring-rose-100"
                        : "border-slate-300 bg-white focus:border-slate-400 focus:ring-slate-200/70"
                    }`}
                    disabled={loading}
                  />
                </Field>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[14px] leading-7 text-slate-500">
            提交任务后将返回 near / medium / far 三组刺激词及语义距离信息。
            {loading ? (
              <span className="ml-2 inline-flex items-center gap-2 text-slate-600">
                处理中
                <LoadingDots />
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canOpenResult ? (
              <button
                type="button"
                onClick={onOpenResult}
                className="inline-flex min-w-[144px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
              >
                {resultButtonLabel}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex min-w-[144px] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner-ring border-white/90 border-t-transparent" />
                  任务处理中
                </span>
              ) : hasResult ? (
                "重新生成"
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
