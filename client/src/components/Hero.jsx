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
            AI Design Tool
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            AI设计刺激词生成器
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            输入一个设计需求或设计问题，系统将基于 GLM-5 生成 Near、Medium、Far
            三类刺激词，帮助你从结构、场景到跨领域隐喻快速打开思路。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {TAGS.map((tag) => (
            <div
              key={tag.label}
              className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm"
            >
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tag.color}`}
              >
                {tag.label}
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {tag.label === "Near" && "聚焦功能、结构、材料与性能。"}
                {tag.label === "Medium" && "转向场景、行为与使用体验。"}
                {tag.label === "Far" && "连接自然意象、隐喻与跨领域。"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

