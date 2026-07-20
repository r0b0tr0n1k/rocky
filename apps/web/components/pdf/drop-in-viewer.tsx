"use client";

import { PDFViewer, type PDFViewerRef } from "@embedpdf/react-pdf-viewer";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

interface DropInViewerProps {
  /** Raw PDF bytes (base64-decoded from `DocumentResponse.content`). */
  bytes: Uint8Array;
  /** Display / download file name (used for the tab + download button). */
  name: string;
  className?: string;
}

/**
 * Drop-in PDF viewer for generated documents, built on EmbedPDF
 * (`@embedpdf/react-pdf-viewer`, MIT — no watermark, no license key).
 *
 * Renders the PDF in-browser with a built-in toolbar whose **print** and
 * **download** actions are enabled by default. The theme follows the app's
 * `next-themes` preference and is tinted with the Rocky brand green.
 *
 * Customizable (per need): toggle UI categories via `disabledCategories`,
 * e.g. to hide print/download pass `disabledCategories: ["annotation", "print", "export"]`.
 * Brand color lives in `theme.{light,dark}.accent.primary`.
 */
export default function DropInViewer({ bytes, name, className }: DropInViewerProps) {
  const viewerRef = useRef<PDFViewerRef>(null);
  const { resolvedTheme } = useTheme();

  // Load the document into the viewer whenever the bytes/name change.
  useEffect(() => {
    let active = true;
    void (async () => {
      const registry = await viewerRef.current?.registry;
      if (!registry || !active) return;
      const plugin = registry.getPlugin("document-manager");
      if (!plugin) return;
      const provides = plugin.provides;
      if (!provides) return;
      const docManager = provides();
      // openDocumentBuffer expects a raw ArrayBuffer (not a Uint8Array view).
      const buffer = bytes.slice().buffer;
      docManager.openDocumentBuffer({ buffer, name, autoActivate: true });
    })();
    return () => {
      active = false;
    };
  }, [bytes, name]);

  return (
    <PDFViewer
      ref={viewerRef}
      className={className}
      config={{
        theme: {
          preference: resolvedTheme === "dark" ? "dark" : "light",
          light: { accent: { primary: "#16a34a" } },
          dark: { accent: { primary: "#22c55e" } },
        },
      }}
    />
  );
}
