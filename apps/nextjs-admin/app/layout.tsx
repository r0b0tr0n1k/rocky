import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "#components/trpc-provider";

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
      </body>
    </html>
  );
}
