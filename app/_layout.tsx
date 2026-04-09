import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ChecklistProvider } from "../context/ChecklistProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ChecklistProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="checklist/[id]"
              options={{ headerShown: false }}
            />
          </Stack>
        </ChecklistProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
