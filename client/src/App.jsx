import { useEffect, useRef, useState, startTransition } from "react";
import Hero from "./components/Hero";
import PromptComposer from "./components/PromptComposer";
import StimulusColumn from "./components/StimulusColumn";
import DetailPanel from "./components/DetailPanel";
import StatusBlock from "./components/StatusBlock";
import { STIMULUS_GROUPS } from "./lib/categories";
import { generateStimuli } from "./lib/api";
import { useStimulusSelection } from "./hooks/useStimulusSelection";

const DEFAULT_PROMPT =
  "为一款帮助自由职业者管理注意力切换的桌面型工作辅助工具生成设计刺激词，重点关注沉浸感、轻提醒与情绪负担控制。";

export default function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const { selection, selectedItem, selectItem } = useStimulusSelection(result);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("请输入设计需求或设计问题后再生成。");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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

          {loading ? (
            <StatusBlock
              type="loading"
              message="正在生成三类设计刺激词，请稍候。"
            />
          ) : null}

          {!loading && error ? (
            <StatusBlock type="error" message={error} />
          ) : null}

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

              <DetailPanel
                selection={selection}
                selectedItem={selectedItem}
              />
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}

