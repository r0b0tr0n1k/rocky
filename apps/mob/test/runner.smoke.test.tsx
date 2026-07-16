import { Text, View } from "react-native";
import { render, screen } from "@testing-library/react";

// Smoke test proving the mobile vitest harness is wired: react-native is
// aliased to react-native-web and rendered into jsdom, queried with the DOM
// testing library. Real tab tests live next to their screens.
describe("mobile test harness", () => {
  it("renders react-native-web components into the DOM", () => {
    render(
      <View testID="box">
        <Text>Rocky mobile harness</Text>
      </View>,
    );
    expect(screen.getByText("Rocky mobile harness")).toBeInTheDocument();
  });
});
