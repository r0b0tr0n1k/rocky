import type { Meta } from 'nextra'

const meta: Meta = {
  // Landing
  index: 'Introduction',
  'get-started': 'Get Started',

  // --- Learn ---
  '###learn': { type: 'separator', title: 'Learn' },
  tutorials: 'Tutorials',

  // --- Decide / Understand ---
  '###decide': { type: 'separator', title: 'Architecture' },
  ADR: 'Decision Records (ADR)',
  explanation: 'Explanation',

  // --- Build & Operate ---
  '###build': { type: 'separator', title: 'Build & Operate' },
  'how-to': 'How-to Guides',
  reference: 'Reference',
  runbooks: 'Runbooks',

  // --- Project ---
  '###proj': { type: 'separator', title: 'Project' },
  'offline-architecture': 'Offline Sync Architecture',
  'diamond-seal-audit': 'Diamond Seal Audit',
  'router-design': 'Router Design (Canonical Blueprint)',
  'router-patterns': 'Router Patterns & Anti-Patterns',
  'result-monad-and-error-sovereignty': 'Result Monad & Error Sovereignty',
  'TESTING_DOCTRINE': 'Testing the Doctrine',
  workorder: 'Work Order — Pending Tasks',
}

export default meta
