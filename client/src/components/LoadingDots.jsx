export default function LoadingDots({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
    </span>
  );
}
