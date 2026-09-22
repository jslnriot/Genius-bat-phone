import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { getCallingNumber } from "@/lib/calling-number";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bat Phone Live Demo",
  description: "Internal employee calling tool",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const callingNumber = user
    ? await getCallingNumber(supabase, user.id)
    : null;
  const showAppNav = Boolean(user && callingNumber);

  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          "antialiased",
          showAppNav && "h-dvh overflow-hidden",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[480px] flex-col",
            showAppNav ? "h-dvh" : "min-h-dvh pb-6",
          )}
        >
          <AppHeader homeHref={showAppNav ? "/contacts" : undefined} />
          <main
            className={cn(
              "px-4 pt-4 pb-6",
              showAppNav && "min-h-0 flex-1 overflow-y-auto",
            )}
          >
            {children}
          </main>
          {showAppNav ? <BottomNav /> : null}
        </div>
      </body>
    </html>
  );
}
