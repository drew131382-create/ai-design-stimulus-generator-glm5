import { useEffect } from "react";

export default function ResultModal({
  open,
  title = "生成结果",
  children,
  onClose
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 backdrop-blur-sm md:p-6">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-[min(92vh,1080px)] w-full max-w-[1680px] flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/92 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 md:px-7">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 md:text-xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              结果在弹窗中查看，关闭后可继续编辑输入内容。
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 transition duration-200 hover:border-slate-300 hover:text-slate-800"
            aria-label="关闭结果弹窗"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-7 md:py-6">
          {children}
        </div>
      </section>
    </div>
  );
}
