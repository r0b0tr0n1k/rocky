import "@total-typescript/ts-reset";
import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "#components/trpc-provider";
import { Toaster } from "@rocky/ui/components/sonner";
import { authClient } from "#lib/auth-client";

export const metadata: Metadata = {
  title: "AIMCS Admin",
  description: "Animal Identification & Movement Control System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>{children}</TRPCProvider>
        <Toaster />
      </body>
    </html>
  );
}
