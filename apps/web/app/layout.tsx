// biome-ignore assist/source/organizeImports: OK
import { AuthProvider } from "#components/auth/index.js";
import { TRPCProvider } from "#components/trpc-provider.js";
import { Toaster } from "@rocky/ui/components/sonner";
import "@total-typescript/ts-reset";
import type { Metadata } from "next";
import "./globals.js";

export const metadata: Metadata = {
  title: "AIMCS Admin",
  description: "Animal Identification & Movement Control System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>
          <AuthProvider>{children}</AuthProvider>
        </TRPCProvider>
        <Toaster />
      </body>
    </html>
  );
}
