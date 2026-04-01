import LoadingDots from "./LoadingDots";

export default function PromptComposer({
  prompt,
  promptError,
  onPromptChange,
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
            <span className="text-xs font-medium text-slate-500">单输入框模式</span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            请输入完整设计题目、目标或问题描述，系统会自动生成三组刺激词。
          </p>
          <p className="text-xs leading-5 text-slate-500">
            注：语义距离基于 ZHIPU 的 Embedding-3 模型计算。
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            任务描述（prompt）*
          </span>

          <textarea
            rows={6}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="例如：我要设计一款仿生机器人，用于复杂工厂巡检，希望提高稳定性、可靠性和可维护性。"
            className={`w-full resize-y rounded-2xl border px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
              promptError
                ? "border-rose-300 bg-rose-50/70 focus:border-rose-300 focus:ring-rose-100"
                : "border-slate-200 bg-slate-50/80 focus:border-slate-300 focus:ring-slate-200/60"
            }`}
            disabled={loading}
          />

          {promptError ? <p className="text-xs text-rose-600">{promptError}</p> : null}
        </label>

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
