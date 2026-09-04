import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="mx-auto min-h-dvh w-full max-w-[480px] pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <AppHeader />
          <main className="px-4 pt-4 pb-6">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
