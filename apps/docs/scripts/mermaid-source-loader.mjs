// Turbopack loader: treat committed Mermaid `.mmd` source files as empty modules.
//
// ADR-0104 keeps architecture diagram *sources* (`.mmd`) next to the rendered
// `.png` assets under `apps/docs/content/explanation/system-architecture/`. The
// site only embeds the PNGs (in `public/diagrams/...`); the `.mmd` files are
// re-render sources and must never be imported as page/JS modules. Nextra's
// content scan still enumerates every file under `content/`, so Turbopack needs
// a rule that resolves `.mmd` to a no-op module instead of failing with
// "Unknown module type".
export default function mermaidSourceLoader() {
  return 'export default "";';
}
