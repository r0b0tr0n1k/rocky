import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

// expo-router is not run under vitest — provide no-op router primitives.
// Covers every expo-router export referenced across the (tabs) screens.
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: ({ children }: { children?: React.ReactNode }) => children,
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

// ThemeProvider is imported from a subpath by _layout.tsx
vi.mock("expo-router/react-navigation", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("expo-router/html", () => ({
  ScrollViewStyleReset: () => null,
}));

// Toast surface is a side-effect; make it observable/silent.
vi.mock("@/lib/notify", () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
