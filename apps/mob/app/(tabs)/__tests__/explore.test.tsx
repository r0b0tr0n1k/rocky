import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import ProfileScreen from "../explore";
import { signOut } from "@/lib/auth";

// SMOKE test only — the Profile (explore) tab is intentionally UNWIRED by
// design: it renders a static "Profile" heading and a destructive "Sign Out"
// button. No tRPC seeding. `@/lib/auth` is mocked inside test/render.tsx, so
// `signOut` here is that mock — we assert against it, never re-mock it.

test("renders the Profile heading and Sign Out button", () => {
  renderWithProviders(<ProfileScreen />);
  expect(screen.getByText("Profile")).toBeTruthy();
  expect(screen.getByText("Sign Out")).toBeTruthy();
});

test("calls signOut when the Sign Out button is pressed", () => {
  renderWithProviders(<ProfileScreen />);
  fireEvent.click(screen.getByText("Sign Out"));
  expect(signOut).toHaveBeenCalledTimes(1);
});
