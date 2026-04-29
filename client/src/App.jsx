import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Hero from "./components/Hero";
import PromptComposer from "./components/PromptComposer";
import StimulusColumn from "./components/StimulusColumn";
import DetailPanel from "./components/DetailPanel";
import StatusBlock from "./components/StatusBlock";
import ResultModal from "./components/ResultModal";
import HistoryPanel from "./components/HistoryPanel";
import TaskCard from "./components/TaskCard";
import { STIMULUS_GROUPS } from "./lib/categories";
import { createGenerateJob, waitForGenerateJob } from "./lib/api";
import {
  createStimulusHistoryRecord,
  getHistoryWords,
  loadStimulusHistory,
  saveStimulusHistoryRecord
} from "./lib/stimulusHistory";
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

const MODAL_MODES = {
  current: "current",
  history: "history"
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
    errors.product = `请输入至少 ${PRODUCT_MIN_LENGTH} 个字`;
  } else if (task.product.length > PRODUCT_MAX_LENGTH) {
    errors.product = `产品需控制在 ${PRODUCT_MAX_LENGTH} 个字以内`;
  }

  if (task.user.length > USER_MAX_LENGTH) {
    errors.user = `用户需控制在 ${USER_MAX_LENGTH} 个字以内`;
  }

  if (task.goal.length > GOAL_MAX_LENGTH) {
    errors.goal = `目标需控制在 ${GOAL_MAX_LENGTH} 个字以内`;
  }

  if (task.constraints.length > CONSTRAINTS_MAX_LENGTH) {
    errors.constraints = `约束条件需控制在 ${CONSTRAINTS_MAX_LENGTH} 个字以内`;
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
      label: "按生成分类",
      description: "保留 GLM 原始生成的 near / medium / far 分组"
    },
    {
      key: VIEW_MODES.semantic,
      label: "按语义距离分类",
      description: "基于已有 30 个词的语义距离重新排序后分组"
    }
  ];

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-panel backdrop-blur md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">分类方式</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            切换只影响这 30 个已生成词的展示分组，不会重新生成内容。
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
          当前为语义距离分类：依据 ZHIPU Embedding-3 计算的语义距离，从近到远重新分成 near / medium / far。
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          当前为生成分类：沿用 GLM 生成结果中的 near / medium / far 原始分组。
        </p>
      )}
    </section>
  );
}

function buildStatusCopy(jobState) {
  if (!jobState || jobState.status === "submitting") {
    return {
      message: "正在提交任务，准备加入生成队列...",
      hint: "任务提交成功后，会自动在后台继续执行，你可以随时关闭弹窗后再回来查看。"
    };
  }

  if (jobState.status === "queued") {
    const aheadCount = Math.max((jobState.queuePosition || 1) - 1, 0);
    const waitMinutes = Math.max(
      1,
      Math.ceil((jobState.estimatedWaitSeconds || 0) / 60)
    );

    return {
      message: `任务排队中，前方还有 ${aheadCount} 个任务，预计等待 ${waitMinutes} 分钟左右。`,
      hint: "当前结果页会持续更新状态，不会重新发起生成请求。"
    };
  }

  return {
    message: "正在生成刺激词，预计等待 2-3 分钟...",
    hint: "系统正在调用 GLM 和 Embedding 处理结果，请稍候。"
  };
}

export default function App() {
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [result, setResult] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.semantic);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(MODAL_MODES.current);
  const [activeHistoryRecord, setActiveHistoryRecord] = useState(null);
  const [historyRecords, setHistoryRecords] = useState(() =>
    loadStimulusHistory()
  );
  const [jobState, setJobState] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const isLoading = ["submitting", "queued", "processing"].includes(
    jobState?.status
  );

  const activeResult =
    modalMode === MODAL_MODES.history ? activeHistoryRecord?.result : result;
  const activeTask =
    modalMode === MODAL_MODES.history ? activeHistoryRecord?.task : currentTask;
  const activeIsLoading = modalMode === MODAL_MODES.current && isLoading;
  const activeError = modalMode === MODAL_MODES.current ? error : "";

  const displayResult = useMemo(() => {
    if (!activeResult) {
      return null;
    }

    if (viewMode === VIEW_MODES.semantic) {
      return buildSemanticGroups(activeResult);
    }

    return activeResult;
  }, [activeResult, viewMode]);

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
      setError(Object.values(errors)[0] || "请检查输入内容");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResult(null);
    setActiveHistoryRecord(null);
    setModalMode(MODAL_MODES.current);
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
      const taskForRequest = {
        ...task,
        excludeWords: getHistoryWords(historyRecords)
      };
      const createdJob = await createGenerateJob(taskForRequest, controller.signal);
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
        const historyRecord = createStimulusHistoryRecord(
          task,
          finalJob.result
        );
        const nextHistoryRecords = saveStimulusHistoryRecord(
          historyRecord,
          historyRecords
        );

        startTransition(() => {
          setResult(finalJob.result);
          setCurrentTask(task);
          setHistoryRecords(nextHistoryRecords);
          setViewMode(VIEW_MODES.semantic);
          setError("");
          setJobState(finalJob);
        });
        return;
      }

      const failedMessage =
        finalJob.error?.message || "生成失败，请稍后重试。";
      setError(failedMessage);
      setJobState(finalJob);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        const message = requestError.message || "生成失败，请稍后重试。";
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

  const handleOpenCurrentResult = () => {
    setModalMode(MODAL_MODES.current);
    setActiveHistoryRecord(null);
    setResultModalOpen(true);
  };

  const handleOpenHistoryRecord = (record) => {
    setModalMode(MODAL_MODES.history);
    setActiveHistoryRecord(record);
    setViewMode(VIEW_MODES.semantic);
    setResultModalOpen(true);
  };

  const statusCopy = buildStatusCopy(jobState);
  const canOpenResult = Boolean(result || jobState || error);
  const resultButtonLabel = isLoading
    ? "查看进度"
    : error
      ? "查看状态"
      : "查看结果";

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
          onOpenResult={handleOpenCurrentResult}
          loading={isLoading}
          hasResult={Boolean(result)}
          canOpenResult={canOpenResult}
          resultButtonLabel={resultButtonLabel}
        />

        <HistoryPanel
          records={historyRecords}
          activeRecordId={activeHistoryRecord?.id}
          onOpenRecord={handleOpenHistoryRecord}
        />
      </main>

      <ResultModal
        open={resultModalOpen}
        title={modalMode === MODAL_MODES.history ? "历史结果" : "生成结果"}
        onClose={() => setResultModalOpen(false)}
      >
        {activeIsLoading ? (
          <StatusBlock
            type="loading"
            message={statusCopy.message}
            hint={statusCopy.hint}
          />
        ) : null}

        {!activeIsLoading && activeError ? (
          <StatusBlock type="error" message={activeError} />
        ) : null}

        {!activeIsLoading && !activeError && displayResult ? (
          <section className="space-y-5">
            <TaskCard task={activeTask} />

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
