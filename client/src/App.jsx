import { useEffect, useRef, useState, startTransition } from "react";
import Hero from "./components/Hero";
import PromptComposer from "./components/PromptComposer";
import StimulusColumn from "./components/StimulusColumn";
import DetailPanel from "./components/DetailPanel";
import StatusBlock from "./components/StatusBlock";
import { STIMULUS_GROUPS } from "./lib/categories";
import { generateStimuli } from "./lib/api";
import { useStimulusSelection } from "./hooks/useStimulusSelection";

const INITIAL_TASK_FORM = {
  product: "",
  user: "",
  scenario: "",
  goal: "",
  constraints: "",
  styleTags: "",
  emotionTags: "",
  existingIdeas: "",
  avoidDirections: "",
  notes: ""
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function splitTags(value) {
  return normalizeText(value)
    .split(/[,，、\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildTask(form) {
  return {
    product: normalizeText(form.product),
    user: normalizeText(form.user),
    scenario: normalizeText(form.scenario),
    goal: normalizeText(form.goal),
    constraints: normalizeText(form.constraints),
    styleTags: splitTags(form.styleTags),
    emotionTags: splitTags(form.emotionTags),
    existingIdeas: normalizeText(form.existingIdeas),
    avoidDirections: normalizeText(form.avoidDirections),
    notes: normalizeText(form.notes)
  };
}

function validateLength(value, min, max) {
  return value.length >= min && value.length <= max;
}

function validateTask(form) {
  const task = buildTask(form);
  const errors = {};

  if (!validateLength(task.product, 2, 30)) {
    errors.product = "product 需 2-30 字";
  }

  if (!validateLength(task.user, 2, 50)) {
    errors.user = "user 需 2-50 字";
  }

  if (!task.scenario) {
    errors.scenario = "scenario 不能为空";
  }

  return {
    task,
    errors,
    valid: Object.keys(errors).length === 0
  };
}

export default function App() {
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const abortRef = useRef(null);
  const { selection, selectedItem, selectItem } = useStimulusSelection(result);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isResultModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isResultModalOpen]);

  useEffect(() => {
    if (!isResultModalOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsResultModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isResultModalOpen]);

  const handleFieldChange = (key, value) => {
    setTaskForm((current) => ({
      ...current,
      [key]: value
    }));

    setFormErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = {
        ...current
      };
      delete next[key];
      return next;
    });
  };

  const handleGenerate = async () => {
    const { task, errors, valid } = validateTask(taskForm);

    if (!valid) {
      setFormErrors(errors);
      setError(Object.values(errors)[0] || "请完善必填字段后再生成");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsResultModalOpen(true);
    setLoading(true);
    setError("");

    try {
      const payload = await generateStimuli(task, controller.signal);
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
          form={taskForm}
          errors={formErrors}
          onFieldChange={handleFieldChange}
          onGenerate={handleGenerate}
          loading={loading}
          hasResult={Boolean(result)}
        />

        <section className="space-y-5">
          {!isResultModalOpen && loading ? (
            <StatusBlock type="loading" message="正在生成刺激词..." />
          ) : null}

          {!isResultModalOpen && !loading && error ? (
            <StatusBlock type="error" message={error} />
          ) : null}

          {!loading && !error && !result ? (
            <StatusBlock
              type="empty"
              message="填写任务后生成结果会以弹窗形式展示。"
            />
          ) : null}

          {!loading && !error && result && !isResultModalOpen ? (
            <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-panel">
              <p className="text-sm text-slate-600">结果已生成，可重新打开弹窗查看。</p>
              <button
                type="button"
                onClick={() => setIsResultModalOpen(true)}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-slate-700"
              >
                打开结果弹窗
              </button>
            </section>
          ) : null}
        </section>
      </main>

      {isResultModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 p-4 backdrop-blur-sm md:p-6"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              setIsResultModalOpen(false);
            }
          }}
        >
          <section className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-shell shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-5 py-4 md:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">设计刺激结果</h2>
                <p className="text-xs text-slate-500">near / medium / far 三组结构化结果</p>
              </div>
              <button
                type="button"
                onClick={() => setIsResultModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-600 transition hover:bg-slate-100"
                aria-label="关闭弹窗"
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 md:p-6">
              {loading ? (
                <div className="mx-auto max-w-xl">
                  <StatusBlock type="loading" message="正在生成刺激词..." />
                </div>
              ) : null}

              {!loading && error ? (
                <div className="mx-auto max-w-xl">
                  <StatusBlock type="error" message={error} />
                </div>
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
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
