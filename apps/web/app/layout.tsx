// biome-ignore assist/source/organizeImports: OK
import { AuthProvider } from "#components/auth/index";
import { TRPCProvider } from "#components/trpc-provider";
import { PermissionsProvider } from "#lib/permissions";
import { ThemeProvider } from "#components/theme-provider";
import { Toaster } from "@rocky/ui/components/sonner";
import "@total-typescript/ts-reset";
import { IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});
// Ioskeley Mono — open-source Berkeley-Mono-alike, self-hosted WOFF2 from
// apps/fonts/IoskeleyMono. Exposed as --font-ioskeley-mono for --font-mono.
const ioskeleyMono = localFont({
  src: [
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-Italic.woff2", weight: "400", style: "italic" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-SemiBoldItalic.woff2", weight: "600", style: "italic" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-ioskeley-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIMCS Admin",
  description: "Animal Identification & Movement Control System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plexSans.variable} ${ioskeleyMono.variable}`}>
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
