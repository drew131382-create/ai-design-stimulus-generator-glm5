import { useEffect, useRef, useState, startTransition } from "react";
import Hero from "./components/Hero";
import PromptComposer from "./components/PromptComposer";
import StimulusColumn from "./components/StimulusColumn";
import DetailPanel from "./components/DetailPanel";
import StatusBlock from "./components/StatusBlock";
import { STIMULUS_GROUPS } from "./lib/categories";
import { generateStimuli } from "./lib/api";
import { useStimulusSelection } from "./hooks/useStimulusSelection";

const MIN_PROMPT_LENGTH = 2;
const MAX_PROMPT_LENGTH = 4000;

function normalizePrompt(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validatePrompt(value) {
  const prompt = normalizePrompt(value);

  if (prompt.length < MIN_PROMPT_LENGTH) {
    return { prompt, error: `请输入至少 ${MIN_PROMPT_LENGTH} 个字` };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { prompt, error: `输入内容不能超过 ${MAX_PROMPT_LENGTH} 字` };
  }

  return { prompt, error: "" };
}

export default function App() {
  const [promptInput, setPromptInput] = useState("");
  const [promptError, setPromptError] = useState("");
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

  const handlePromptChange = (value) => {
    setPromptInput(value);

    if (promptError) {
      setPromptError("");
    }
  };

  const handleGenerate = async () => {
    const { prompt, error: validationError } = validatePrompt(promptInput);

    if (validationError) {
      setPromptError(validationError);
      setError(validationError);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const payload = await generateStimuli(prompt, controller.signal);
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
          prompt={promptInput}
          promptError={promptError}
          onPromptChange={handlePromptChange}
          onGenerate={handleGenerate}
          loading={loading}
          hasResult={Boolean(result)}
        />

        <section className="space-y-5">
          {loading ? <StatusBlock type="loading" message="正在生成刺激词..." /> : null}

          {!loading && error ? <StatusBlock type="error" message={error} /> : null}

          {!loading && !error && !result ? (
            <StatusBlock type="empty" message="输入设计任务后，生成结果会显示在下方。" />
          ) : null}

          {!loading && !error && result ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,2.1fr)_minmax(360px,1fr)] xl:items-start">
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

              <div className="xl:sticky xl:top-0">
                <DetailPanel selection={selection} selectedItem={selectedItem} />
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
