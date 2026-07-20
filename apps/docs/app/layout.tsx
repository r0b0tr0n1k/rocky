import { Rubik } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import type { ReactNode } from "react";
import "./globals.css";

// Scoped Sentry visual-token reference (DESIGN.sentry.md): Rubik for UI/body,
// Rubik (UI/body). Ioskeley Mono (code) is self-hosted below. Non-governing — Rocky green stays primary.
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

// Ioskeley Mono — open-source Berkeley-Mono-alike, self-hosted WOFF2 from
// apps/fonts/IoskeleyMono. Exposed as --font-ioskeley-mono for --font-mono.
const ioskeleyMono = localFont({
  src: [
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-Black.woff2", weight: "800", style: "normal" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-SemiBoldItalic.woff2", weight: "600", style: "italic" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-BoldItalic.woff2", weight: "700", style: "italic" },
    { path: "../../fonts/IoskeleyMono/IoskeleyMono-BlackItalic.woff2", weight: "800", style: "italic" },
  ],
  variable: "--font-ioskeley-mono",
  display: "swap",
});

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

export const metadata = {
  title: "Rocky Docs",
  description: "Documentation for the Rocky livestock platform",
  // Explicit favicon: Nextra 4's <Head> has no `icon` prop and does not forward
  // the Next.js app/icon.svg convention into <head>, so the browser falls back to
  // a default /favicon.ico request that hits Nextra's [...mdxPath] catch-all (404).
  // Pin it here to the already-served, on-brand asset. (Docs Bot)
  icons: { icon: "/rocky-goat.svg" },
};

const banner = (
  // Static, non-script banner: replaces Nextra's <Banner>, whose inline
  // localStorage dismiss <script> triggers a React 19 "Encountered a script
  // tag while rendering React component" warning. This keeps the WIP notice
  // without emitting any <script>. (Docs Bot)
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: ".4em",
      padding: ".5rem 1rem",
      backgroundColor:
        "hsl(var(--nextra-primary-hue) var(--nextra-primary-saturation) var(--nextra-primary-lightness) / 0.12)",
      borderBottom:
        "1px solid hsl(var(--nextra-primary-hue) var(--nextra-primary-saturation) var(--nextra-primary-lightness) / 0.25)",
      color: "var(--nextra-text)",
      fontSize: ".875rem",
      textAlign: "center",
    }}
  >
    <InfoIcon />
    <span>Rocky Docs — work in progress</span>
  </div>
);
const navbar = (
  <Navbar
    logo={<img src="/rocky-goat.svg" alt="Rocky" style={{ height: 28, width: "auto" }} className="rocky-logo" />}
  />
);
const footer = (
  <Footer>
    <img
      src="/rocky-goat.svg"
      alt="Rocky"
      className="rocky-logo"
      style={{ height: 24, width: "auto", marginRight: ".6em" }}
    />
    <Link
      href="https://github.com/rocky/rocky"
      target="_blank"
      rel="noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: ".45em" }}
    >
      <GitHubIcon />
      <span>MIT {new Date().getFullYear()} © Rocky.</span>
    </Link>
  </Footer>
);

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${rubik.variable} ${ioskeleyMono.variable}`}>
      <Head
        color={{
          hue: { light: 152, dark: 150 },
          saturation: { light: 68, dark: 60 },
          lightness: { light: 38, dark: 68 },
        }}
        backgroundColor={{ light: "#f9fdfa", dark: "#0a0a0a" }}
      />
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/rocky/rocky/tree/main/apps/docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
