const TAGS = [
  { label: "Near", color: "bg-near-100 text-near-700" },
  { label: "Medium", color: "bg-medium-100 text-medium-700" },
  { label: "Far", color: "bg-far-100 text-far-700" }
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-8 shadow-panel backdrop-blur xl:p-10">
      <div className="absolute inset-0 bg-mesh opacity-90" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-600">
            AI 设计工具
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            AI 设计刺激词生成器
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            输入你的设计任务，系统将基于 GLM 生成 near / medium / far 三组刺激词，帮助你快速拓展设计方向。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          {TAGS.map((tag) => (
            <span
              key={tag.label}
              className={`inline-flex rounded-full border border-white/80 px-3 py-1.5 text-xs font-semibold ${tag.color}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
