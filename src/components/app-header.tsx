import { Phone } from "lucide-react";

export function AppHeader() {
  return (
    <header
      aria-label="Bat Phone"
      className="sticky top-0 z-40 border-b border-border bg-white pt-[env(safe-area-inset-top)]"
    >
      <div className="flex h-14 items-center gap-3 px-4">
        <Phone aria-hidden="true" size={20} className="shrink-0 text-primary" />
        <span className="text-base font-semibold text-primary">Bat Phone</span>
      </div>
    </header>
  );
}
