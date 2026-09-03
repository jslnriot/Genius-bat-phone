export default function CallsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex animate-pulse flex-col gap-6 motion-reduce:animate-none"
    >
      <div className="space-y-2">
        <div className="h-[34px] w-24 rounded bg-[var(--color-muted-background)]" />
        <div className="h-5 w-52 rounded bg-[var(--color-muted-background)]" />
      </div>
      <div className="overflow-hidden rounded-(--radius-card) border border-border bg-white">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-20 border-b border-border last:border-b-0"
          />
        ))}
      </div>
      <span className="sr-only">Loading calls…</span>
    </div>
  );
}
