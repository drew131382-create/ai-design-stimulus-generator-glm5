import { useEffect, useRef, useState, startTransition } from "react";
import Hero from "./components/Hero";
import PromptComposer from "./components/PromptComposer";
import StimulusColumn from "./components/StimulusColumn";
import DetailPanel from "./components/DetailPanel";
import StatusBlock from "./components/StatusBlock";
import TaskCard from "./components/TaskCard";
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
    errors.product = "product must be 2-30 chars";
  }

  if (!validateLength(task.user, 2, 50)) {
    errors.user = "user must be 2-50 chars";
  }

  if (!validateLength(task.goal, 10, 150)) {
    errors.goal = "goal must be 10-150 chars";
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
  const abortRef = useRef(null);
  const { selection, selectedItem, selectItem } = useStimulusSelection(result);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
      setError(Object.values(errors)[0] || "Please complete required fields");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const payload = await generateStimuli(task, controller.signal);
      startTransition(() => {
        setResult(payload);
      });
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Generation failed. Please retry.");
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Design Stimulus Results
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Click any card to inspect details and rationale.
              </p>
            </div>
          </div>

          {loading ? <StatusBlock type="loading" message="Generating stimuli..." /> : null}

          {!loading && error ? <StatusBlock type="error" message={error} /> : null}

          {!loading && !error && !result ? (
            <StatusBlock
              type="empty"
              message="Fill the task and generate near / medium / far structured stimuli."
            />
          ) : null}

          {!loading && !error && result ? (
            <>
              <TaskCard task={result.task} />

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
