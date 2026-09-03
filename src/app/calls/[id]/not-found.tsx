import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function CallNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-[34px] text-primary">
          Call not found
        </h1>
        <p className="text-sm text-secondary-text">
          This call may no longer be available.
        </p>
      </header>
      <Link
        href="/calls"
        className={buttonVariants({ className: "w-full gap-2" })}
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Back to calls
      </Link>
    </div>
  );
}
