import { StyleSheet, View } from "react-native";
import { TodosList } from "#/components/todos/todos-list.js";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <TodosList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
