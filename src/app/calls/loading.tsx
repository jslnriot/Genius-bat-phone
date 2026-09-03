export default function CallsLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-[34px] w-24 rounded bg-[var(--color-muted-background)]" />
        <div className="h-5 w-52 rounded bg-[var(--color-muted-background)]" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white"
          />
        ))}
      </div>
      <span className="sr-only">Loading calls...</span>
    </div>
  );
}
