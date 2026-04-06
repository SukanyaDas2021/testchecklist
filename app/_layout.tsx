import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChecklistProvider } from "../context/ChecklistProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ChecklistProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="checklist/[id]"
            options={{ title: "Checklist" }}
          />
        </Stack>
      </ChecklistProvider>
    </GestureHandlerRootView>
  );
}

// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import "react-native-reanimated";

// import { useColorScheme } from "@/hooks/use-color-scheme";

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

// export default function RootLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     // 👇 Wrap everything in GestureHandlerRootView
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//         <Stack>
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen
//             name="modal"
//             options={{ presentation: "modal", title: "Modal" }}
//           />
//         </Stack>
//         <StatusBar style="auto" />
//       </ThemeProvider>
//     </GestureHandlerRootView>
//   );
// }
