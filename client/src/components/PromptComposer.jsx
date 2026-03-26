import LoadingDots from "./LoadingDots";

const REQUIRED_FIELDS = [
  {
    key: "product",
    label: "product *",
    placeholder: "e.g. Senior-friendly smart pill box",
    component: "input"
  },
  {
    key: "user",
    label: "user *",
    placeholder: "e.g. Elderly people living alone",
    component: "input"
  },
  {
    key: "goal",
    label: "goal *",
    placeholder: "e.g. Reduce missed doses and improve medication confidence.",
    component: "textarea"
  }
];

const OPTIONAL_FIELDS = [
  {
    key: "scenario",
    label: "scenario",
    placeholder: "e.g. Before morning/evening medication, users need quick status checks.",
    component: "textarea"
  },
  {
    key: "constraints",
    label: "constraints",
    placeholder: "e.g. low cost, simple interaction, offline reminders",
    component: "textarea"
  },
  {
    key: "styleTags",
    label: "styleTags",
    placeholder: "e.g. gentle, trustworthy (comma-separated)",
    component: "input"
  },
  {
    key: "emotionTags",
    label: "emotionTags",
    placeholder: "e.g. relief, control (comma-separated)",
    component: "input"
  },
  {
    key: "notes",
    label: "notes",
    placeholder: "other notes",
    component: "textarea"
  },
  {
    key: "existingIdeas",
    label: "existingIdeas",
    placeholder: "existing ideas",
    component: "textarea"
  },
  {
    key: "avoidDirections",
    label: "avoidDirections",
    placeholder: "what to avoid",
    component: "textarea"
  }
];

function Field({ field, value, error, onFieldChange, loading }) {
  const commonClassName =
    "w-full rounded-2xl border px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4";

  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {field.label}
      </span>

      {field.component === "textarea" ? (
        <textarea
          rows={3}
          value={value}
          onChange={(event) => onFieldChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          className={`${commonClassName} resize-y ${
            error
              ? "border-rose-300 bg-rose-50/70 focus:border-rose-300 focus:ring-rose-100"
              : "border-slate-200 bg-slate-50/80 focus:border-slate-300 focus:ring-slate-200/60"
          }`}
          disabled={loading}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onFieldChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          className={`${commonClassName} ${
            error
              ? "border-rose-300 bg-rose-50/70 focus:border-rose-300 focus:ring-rose-100"
              : "border-slate-200 bg-slate-50/80 focus:border-slate-300 focus:ring-slate-200/60"
          }`}
          disabled={loading}
        />
      )}

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </label>
  );
}

export default function PromptComposer({
  form,
  errors,
  onFieldChange,
  onGenerate,
  loading,
  hasResult
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-panel backdrop-blur md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Design Task Input</h2>
            <span className="text-xs font-medium text-slate-500">Light Mode</span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Fill only 3 key fields (product / user / goal) to generate results.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {REQUIRED_FIELDS.map((field) => (
            <div
              key={field.key}
              className={field.component === "textarea" ? "md:col-span-2" : ""}
            >
              <Field
                field={field}
                value={form[field.key] || ""}
                error={errors[field.key]}
                onFieldChange={onFieldChange}
                loading={loading}
              />
            </div>
          ))}
        </div>

        <details className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Optional fields
          </summary>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {OPTIONAL_FIELDS.map((field) => (
              <div
                key={field.key}
                className={field.component === "textarea" ? "md:col-span-2" : ""}
              >
                <Field
                  field={field}
                  value={form[field.key] || ""}
                  error={errors[field.key]}
                  onFieldChange={onFieldChange}
                  loading={loading}
                />
              </div>
            ))}
          </div>
        </details>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Returns near / medium / far groups with semantic distance.
            {loading ? (
              <span className="ml-2 inline-flex items-center gap-2 text-slate-600">
                Processing
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
                    Regenerating
                  </span>
                ) : (
                  "Regenerate"
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
                  Generating
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
