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
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-4",
                isActive
                  ? "text-[var(--color-action)]"
                  : "text-[var(--color-secondary-text)]"
              )}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
