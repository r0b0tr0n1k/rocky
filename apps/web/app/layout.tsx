// biome-ignore assist/source/organizeImports: OK
import { AuthProvider } from "#components/auth/index";
import { TRPCProvider } from "#components/trpc-provider";
import { ThemeProvider } from "#components/theme-provider";
import { Toaster } from "@rocky/ui/components/sonner";
import "@total-typescript/ts-reset";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIMCS Admin",
  description: "Animal Identification & Movement Control System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TRPCProvider>
            <AuthProvider>{children}</AuthProvider>
          </TRPCProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
