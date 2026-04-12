import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Hero from "./components/Hero";
import PromptComposer from "./components/PromptComposer";
import StimulusColumn from "./components/StimulusColumn";
import DetailPanel from "./components/DetailPanel";
import StatusBlock from "./components/StatusBlock";
import ResultModal from "./components/ResultModal";
import { STIMULUS_GROUPS } from "./lib/categories";
import { createGenerateJob, waitForGenerateJob } from "./lib/api";
import { useStimulusSelection } from "./hooks/useStimulusSelection";

const PRODUCT_MIN_LENGTH = 2;
const PRODUCT_MAX_LENGTH = 30;
const USER_MAX_LENGTH = 50;
const GOAL_MAX_LENGTH = 150;
const CONSTRAINTS_MAX_LENGTH = 150;

const VIEW_MODES = {
  generated: "generated",
  semantic: "semantic"
};

const EMPTY_TASK_FORM = {
  product: "",
  user: "",
  scenario: "",
  goal: "",
  constraints: ""
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateTaskForm(form) {
  const task = {
    product: normalizeText(form.product),
    user: normalizeText(form.user),
    scenario: normalizeText(form.scenario),
    goal: normalizeText(form.goal),
    constraints: normalizeText(form.constraints)
  };

  const errors = {};

  if (task.product.length < PRODUCT_MIN_LENGTH) {
    errors.product = `????? ${PRODUCT_MIN_LENGTH} ??`;
  } else if (task.product.length > PRODUCT_MAX_LENGTH) {
    errors.product = `?????? ${PRODUCT_MAX_LENGTH} ????`;
  }

  if (task.user.length > USER_MAX_LENGTH) {
    errors.user = `?????? ${USER_MAX_LENGTH} ????`;
  }

  if (task.goal.length > GOAL_MAX_LENGTH) {
    errors.goal = `?????? ${GOAL_MAX_LENGTH} ????`;
  }

  if (task.constraints.length > CONSTRAINTS_MAX_LENGTH) {
    errors.constraints = `???????? ${CONSTRAINTS_MAX_LENGTH} ????`;
  }

  return {
    task,
    errors,
    hasError: Object.keys(errors).length > 0
  };
}

function normalizeDistance(item) {
  const distance = Number(item?.semantic_distance);

  if (Number.isFinite(distance)) {
    return distance;
  }

  const score = Number(item?.semantic_distance_score);

  if (Number.isFinite(score)) {
    return score / 100;
  }

  return null;
}

function collectAllStimuli(result) {
  if (!result) {
    return [];
  }

  const items = [];

  for (const group of STIMULUS_GROUPS) {
    const groupItems = Array.isArray(result[group.key]) ? result[group.key] : [];

    for (let index = 0; index < groupItems.length; index += 1) {
      items.push({
        ...groupItems[index],
        __originalGroup: group.key,
        __originalIndex: index
      });
    }
  }

  return items;
}

function buildSemanticGroups(result) {
  const rankedItems = collectAllStimuli(result)
    .map((item, index) => ({
      item,
      index,
      distance: normalizeDistance(item)
    }))
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) {
        return a.index - b.index;
      }

      if (a.distance === null) {
        return 1;
      }

      if (b.distance === null) {
        return -1;
      }

      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.item);

  return {
    ...result,
    near: rankedItems.slice(0, 10),
    medium: rankedItems.slice(10, 20),
    far: rankedItems.slice(20, 30)
  };
}

function ClassificationToggle({ mode, onChange }) {
  const options = [
    {
      key: VIEW_MODES.generated,
      label: "?????",
      description: "?? GLM ????? near / medium / far ??"
    },
    {
      key: VIEW_MODES.semantic,
      label: "???????",
      description: "???? 30 ??????????????"
    }
  ];

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-panel backdrop-blur md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">????</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            ?????? 30 ????????????????????
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {options.map((option) => {
            const active = mode === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onChange(option.key)}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
                  active
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === VIEW_MODES.semantic ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          ???????????? ZHIPU Embedding-3 ???????????????? near / medium / far?
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          ?????????? GLM ?????? near / medium / far ?????
        </p>
      )}
    </section>
  );
}

function buildStatusCopy(jobState) {
  if (!jobState || jobState.status === "submitting") {
    return {
      message: "???????????????...",
      hint: "???????????????????????????????????"
    };
  }

  if (jobState.status === "queued") {
    const aheadCount = Math.max((jobState.queuePosition || 1) - 1, 0);
    const waitMinutes = Math.max(
      1,
      Math.ceil((jobState.estimatedWaitSeconds || 0) / 60)
    );

    return {
      message: `?????????? ${aheadCount} ???????? ${waitMinutes} ?????`,
      hint: "????????????????????????"
    };
  }

  return {
    message: "???????????? 2-3 ??...",
    hint: "?????? GLM ? Embedding ?????????"
  };
}

export default function App() {
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [result, setResult] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.semantic);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [jobState, setJobState] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const isLoading = ["submitting", "queued", "processing"].includes(
    jobState?.status
  );

  const displayResult = useMemo(() => {
    if (!result) {
      return null;
    }

    if (viewMode === VIEW_MODES.semantic) {
      return buildSemanticGroups(result);
    }

    return result;
  }, [result, viewMode]);

  const { selection, selectedItem, selectItem } = useStimulusSelection(
    displayResult
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleFieldChange = (field, value) => {
    setTaskForm((current) => ({
      ...current,
      [field]: value
    }));

    if (formErrors[field]) {
      setFormErrors((current) => ({
        ...current,
        [field]: ""
      }));
    }
  };

  const handleGenerate = async () => {
    const { task, errors, hasError } = validateTaskForm(taskForm);

    if (hasError) {
      setFormErrors(errors);
      setError(Object.values(errors)[0] || "????????");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResult(null);
    setError("");
    setFormErrors({});
    setJobState({
      jobId: "",
      status: "submitting",
      queuePosition: 0,
      estimatedWaitSeconds: 0,
      error: null,
      result: null
    });
    setResultModalOpen(true);

    try {
      const createdJob = await createGenerateJob(task, controller.signal);
      setJobState(createdJob);

      const finalJob = await waitForGenerateJob(createdJob.jobId, {
        signal: controller.signal,
        onStatus: (nextJob) => {
          startTransition(() => {
            setJobState(nextJob);
          });
        }
      });

      if (finalJob.status === "completed" && finalJob.result) {
        startTransition(() => {
          setResult(finalJob.result);
          setViewMode(VIEW_MODES.semantic);
          setError("");
          setJobState(finalJob);
        });
        return;
      }

      const failedMessage =
        finalJob.error?.message || "???????????";
      setError(failedMessage);
      setJobState(finalJob);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        const message = requestError.message || "???????????";
        setError(message);
        setJobState((current) => ({
          ...(current || {}),
          status: "failed",
          error: {
            message
          },
          result: null
        }));
      }
    }
  };

  const statusCopy = buildStatusCopy(jobState);
  const canOpenResult = Boolean(result || jobState || error);
  const resultButtonLabel = isLoading
    ? "????"
    : error
      ? "????"
      : "????";

  return (
    <div className="relative min-h-screen overflow-hidden bg-shell text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="pointer-events-none absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-near-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[20%] h-72 w-72 rounded-full bg-medium-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[35%] h-72 w-72 rounded-full bg-far-200/30 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Hero />

        <PromptComposer
          taskForm={taskForm}
          formErrors={formErrors}
          onFieldChange={handleFieldChange}
          onGenerate={handleGenerate}
          onOpenResult={() => setResultModalOpen(true)}
          loading={isLoading}
          hasResult={Boolean(result)}
          canOpenResult={canOpenResult}
          resultButtonLabel={resultButtonLabel}
        />
      </main>

      <ResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
      >
        {isLoading ? (
          <StatusBlock
            type="loading"
            message={statusCopy.message}
            hint={statusCopy.hint}
          />
        ) : null}

        {!isLoading && error ? <StatusBlock type="error" message={error} /> : null}

        {!isLoading && !error && displayResult ? (
          <section className="space-y-5">
            <ClassificationToggle mode={viewMode} onChange={setViewMode} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,2.1fr)_minmax(380px,1fr)] xl:items-start">
              <div className="grid gap-5 xl:grid-cols-3">
                {STIMULUS_GROUPS.map((group) => (
                  <StimulusColumn
                    key={group.key}
                    group={group}
                    items={displayResult[group.key]}
                    selection={selection}
                    onSelect={selectItem}
                  />
                ))}
              </div>

              <div className="xl:sticky xl:top-0">
                <DetailPanel selection={selection} selectedItem={selectedItem} />
              </div>
            </div>
          </section>
        ) : null}
      </ResultModal>
    </div>
  );
}
