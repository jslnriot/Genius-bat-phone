"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Phone, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    label: "Calls",
    href: "/calls",
    icon: Phone,
  },
  {
    label: "Account",
    href: "/account",
    icon: Settings,
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto w-full max-w-[480px] border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-16 grid-cols-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-16 w-full flex-col items-center justify-center gap-1 px-3 text-xs leading-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action",
                  isActive
                    ? "font-semibold text-action"
                    : "font-medium text-secondary-text hover:text-primary",
                )}
              >
                <Icon aria-hidden="true" size={22} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
