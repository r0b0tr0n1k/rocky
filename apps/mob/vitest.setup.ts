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
// Expo / RN native modules ship TypeScript source (not pre-compiled) and pull in
// the real `react-native` Flow entry. They are native-only and irrelevant to
// jsdom component tests, so stub them as no-op modules. Without this, Vite
// refuses to strip types from their `node_modules/*.ts` source.
const nativeStub = () =>
  new Proxy({} as Record<string, unknown>, {
    get: (_t, prop) => {
      if (prop === "__esModule" || prop === "default") return () => {};
      return () => {};
    },
  });
vi.mock("expo-modules-core", () => nativeStub());
vi.mock("react-native-reanimated", () => nativeStub());
vi.mock("react-native-screens", () => nativeStub());

// expo-secure-store is a native module (TS source) pulled in via @/lib/auth /
// session-provider; its internal require of expo-modules-core bypasses vi.mock
// when externalized, so stub it directly.
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

// NetInfo is a native module with TS source that Vite 8 cannot strip under
// node_modules; OfflineProvider imports it.
vi.mock("@react-native-community/netinfo", () => ({
  default: { addEventListener: () => () => {}, fetch: vi.fn().mockResolvedValue({ isConnected: true }) },
  addEventListener: () => () => {},
  fetch: vi.fn().mockResolvedValue({ isConnected: true }),
}));

vi.mock("@/lib/notify", () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

// The shadcn `Select` (rn-primitives + react-native-reanimated/screens) pulls
// the real `react-native` Flow source into the vitest graph. Replace it with a
// DOM-friendly stub that still renders its `SelectItem` options inline so
// data-backed selects (fed by `list*` queries) are observable and drivable.
vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  const { Text, View } = await import("react-native");
  const SelectCtx = React.createContext<(value: unknown) => void>(() => {});
  const Select = ({
    onValueChange,
    children,
  }: {
    onValueChange?: (opt: { value: string; label: string }) => void;
    children?: React.ReactNode;
  }) =>
    React.createElement(
      SelectCtx.Provider,
      { value: (v: unknown) => onValueChange?.({ value: String(v), label: String(v) }) },
      children,
    );
  const SelectTrigger = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  const SelectValue = ({ placeholder }: { placeholder?: string }) =>
    React.createElement(Text, null, placeholder ?? "");
  const SelectContent = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  const SelectItem = ({ label, value }: { label: string; value: string }) => {
    const onChange = React.useContext(SelectCtx);
    return React.createElement(Text, { onPress: () => onChange(value) }, label);
  };
  const SelectGroup = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  const SelectLabel = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(Text, null, children);
  const SelectSeparator = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator };
});
