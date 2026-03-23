import { useEffect, useRef, useState, startTransition } from "react";
import Hero from "./components/Hero";
import PromptComposer from "./components/PromptComposer";
import StimulusColumn from "./components/StimulusColumn";
import DetailPanel from "./components/DetailPanel";
import StatusBlock from "./components/StatusBlock";
import { STIMULUS_GROUPS } from "./lib/categories";
import { generateStimuli } from "./lib/api";
import { useStimulusSelection } from "./hooks/useStimulusSelection";

const LOADING_COPIES = [
  "正在分析你的设计需求",
  "正在扩展 Near / Medium / Far 语义距离",
  "正在组织结构化刺激词结果",
  "正在校验词项去重与字段完整性"
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCopyIndex, setLoadingCopyIndex] = useState(0);
  const abortRef = useRef(null);
  const { selection, selectedItem, selectItem } = useStimulusSelection(result);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingCopyIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingCopyIndex((current) => (current + 1) % LOADING_COPIES.length);
    }, 1800);

    return () => {
      window.clearInterval(timer);
    };
  }, [loading]);

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("请输入设计需求或设计问题后再生成。");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingCopyIndex(0);
    setLoading(true);
    setError("");

    try {
      const payload = await generateStimuli(trimmedPrompt, controller.signal);
      startTransition(() => {
        setResult(payload);
      });
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "生成失败，请稍后重试。");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadingCopy = LOADING_COPIES[loadingCopyIndex];

  return (
    <div className="relative min-h-screen overflow-hidden bg-shell text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="pointer-events-none absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-near-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[20%] h-72 w-72 rounded-full bg-medium-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[35%] h-72 w-72 rounded-full bg-far-200/30 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Hero />

        <PromptComposer
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          loading={loading}
          hasResult={Boolean(result)}
          loadingCopy={loadingCopy}
        />

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                设计刺激结果
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                点击任意卡片，下方详情面板会同步展示灵感来源与设计方向。
              </p>
            </div>
          </div>

          {loading ? <StatusBlock type="loading" message={loadingCopy} /> : null}

          {!loading && error ? <StatusBlock type="error" message={error} /> : null}

          {!loading && !error && !result ? (
            <StatusBlock
              type="empty"
              message="输入你的设计问题后，系统会返回 Near、Medium、Far 三类共 30 个结构化刺激词。"
            />
          ) : null}

          {!loading && !error && result ? (
            <>
              <div className="grid gap-5 xl:grid-cols-3">
                {STIMULUS_GROUPS.map((group) => (
                  <StimulusColumn
                    key={group.key}
                    group={group}
                    items={result[group.key]}
                    selection={selection}
                    onSelect={selectItem}
                  />
                ))}
              </div>

              <DetailPanel selection={selection} selectedItem={selectedItem} />
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
