import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
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
  const showAppNav = Boolean(user);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div
          className={cn(
            "mx-auto min-h-dvh w-full max-w-[480px]",
            showAppNav
              ? "pb-[calc(5rem+env(safe-area-inset-bottom))]"
              : "pb-6",
          )}
        >
          <AppHeader />
          <main className="px-4 pt-4 pb-6">
            {children}
          </main>
        </div>
        {showAppNav ? <BottomNav /> : null}
      </body>
    </html>
  );
}
