export default function AppLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex animate-pulse flex-col gap-6 motion-reduce:animate-none"
    >
      <div className="space-y-2">
        <div className="h-[34px] w-32 rounded bg-muted-background" />
        <div className="h-5 w-64 max-w-full rounded bg-muted-background" />
      </div>
      <div className="h-12 rounded-(--radius-button) bg-muted-background" />
      <div className="h-24 rounded-(--radius-card) border border-border bg-white" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
