import { Tabs, useSegments } from "expo-router";
import React from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

function AnimatedIcon({ focused, children }: any) {
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
  );
}

export default function TabLayout() {
  const segments = useSegments();
  // The current tab is at index 1, not index 0
  const currentRoute = segments[1] || "index";

  // // Console log to track route changes
  // React.useEffect(() => {
  //   console.log("Full segments array:", segments);
  //   console.log("Current route (segments[1]):", currentRoute);
  // }, [segments, currentRoute]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#f5e7e7",
        tabBarInactiveTintColor: "#ec3838cc",
        tabBarLabelPosition: "beside-icon",
        tabBarLabel: () => null,

        tabBarStyle: {
          backgroundColor: "transparent",
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 0,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },

        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Schedules",
          tabBarButton: (props) => {
            const focused = currentRoute === "index";

            const textColor = focused ? "#570faaab" : "#580faada";
            const textSize = focused ? 22 : 18;

            return (
              <Pressable
                onPress={props.onPress}
                style={{
                  flex: 1,
                  backgroundColor: "#e4abff73",
                  borderRadius: 25,
                  marginHorizontal: 4,
                  paddingVertical: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                  }}
                >
                  {props.children}
                </View>
                <Text
                  style={{
                    fontSize: textSize,
                    fontWeight: "700",
                    color: textColor,
                    textAlign: "center",
                  }}
                >
                  Schedules
                </Text>
              </Pressable>
            );
          },
          tabBarIcon: ({ focused }) => {
            return (
              <AnimatedIcon focused={focused}>
                <IconSymbol
                  size={24}
                  name="checklist"
                  color={focused ? "#6dfc0e" : "#dbf10f"}
                />
              </AnimatedIcon>
            );
          },
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarButton: (props) => {
            const focused = currentRoute === "tasks";

            const textColor = focused ? "#570faaab" : "#580faada";
            const textSize = focused ? 22 : 18;

            return (
              <Pressable
                onPress={props.onPress}
                style={{
                  flex: 1,
                  backgroundColor: "#e4abff73",
                  borderRadius: 25,
                  marginHorizontal: 4,
                  paddingVertical: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                  }}
                >
                  {props.children}
                </View>
                <Text
                  style={{
                    fontSize: textSize,
                    fontWeight: "700",
                    color: textColor,
                    textAlign: "center",
                  }}
                >
                  Tasks
                </Text>
              </Pressable>
            );
          },
          tabBarIcon: ({ focused }) => {
            return (
              <AnimatedIcon focused={focused}>
                <IconSymbol
                  size={24}
                  name="folder"
                  color={focused ? "#6dfc0e" : "#f36709"}
                />
              </AnimatedIcon>
            );
          },
        }}
      />
    </Tabs>
  );
}
