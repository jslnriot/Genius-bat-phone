import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { resolveDefaultAppPath } from "@/lib/app-routing";
import { getAccountDisplayName, getAccountInitials } from "@/lib/account-initials";
import { getCallingNumber } from "@/lib/calling-number";
import { e164ToDisplayPhone } from "@/lib/contact-validation";
import { productMetadata } from "@/lib/product-metadata";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: productMetadata.title,
  description: productMetadata.description,
  applicationName: productMetadata.applicationName,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
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
  const homeHref =
    showAppNav && user
      ? await resolveDefaultAppPath(supabase, user.id, callingNumber)
      : undefined;

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
            "mx-auto flex w-full max-w-[480px] flex-col bg-white",
            showAppNav ? "h-dvh" : "min-h-dvh pb-6",
            "shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:border-x sm:border-border",
          )}
        >
          <AppHeader
            homeHref={homeHref}
            account={
              showAppNav && user?.email && callingNumber
                ? {
                    email: user.email,
                    initials: getAccountInitials(user),
                    displayName: getAccountDisplayName(user),
                    callingNumber: e164ToDisplayPhone(callingNumber),
                  }
                : undefined
            }
          />
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
