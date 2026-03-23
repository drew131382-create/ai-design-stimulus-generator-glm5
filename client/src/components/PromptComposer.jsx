import LoadingDots from "./LoadingDots";

export default function PromptComposer({
  prompt,
  onPromptChange,
  onGenerate,
  loading,
  hasResult,
  loadingCopy
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-panel backdrop-blur md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">设计输入</h2>
            <span className="text-xs font-medium text-slate-500">
              建议 20-300 字
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            可以输入产品需求、交互问题、服务重构方向，或任何希望获得设计刺激的命题。
          </p>
        </div>

        <label className="block">
          <span className="sr-only">设计需求输入框</span>
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="示例：为一款适合独居老年人的智能厨房提醒设备生成设计刺激词，重点考虑安全感、可达性和低学习成本。"
            className="min-h-[180px] w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50/80 px-5 py-4 text-base leading-7 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
            disabled={loading}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            输出将根据你的输入语言自动切换。
            {loading ? (
              <span className="ml-2 inline-flex items-center gap-2 text-slate-600">
                {loadingCopy || "正在处理"}
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
