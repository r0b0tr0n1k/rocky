// biome-ignore assist/source/organizeImports: OK
import { AuthProvider } from "#components/auth/index";
import { TRPCProvider } from "#components/trpc-provider";
import { PermissionsProvider } from "#lib/permissions";
import { ThemeProvider } from "#components/theme-provider";
import { Toaster } from "@rocky/ui/components/sonner";
import "@total-typescript/ts-reset";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "AIMCS Admin",
  description: "Animal Identification & Movement Control System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TRPCProvider>
            <AuthProvider>
              <PermissionsProvider>{children}</PermissionsProvider>
            </AuthProvider>
          </TRPCProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
