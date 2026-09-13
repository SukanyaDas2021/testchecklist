import { useTabBar } from "@/context/TabBarContext";
import { Tabs, useSegments } from "expo-router";
import React, { useEffect, useRef } from "react";
import Icon from "react-native-vector-icons/MaterialIcons";

import {
  Animated,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { setTabBarHeight } = useTabBar();
  const tabBarRef = useRef<View>(null);

  const currentRoute = segments[1] || "index";

  // Dynamic font sizes based on screen width
  const getFontSize = (baseSize: number) => {
    const scale = Math.min(1.2, Math.max(0.8, screenWidth / 375));
    return baseSize * scale;
  };

  // Dynamic icon size based on screen dimensions
  const iconSize = Math.min(28, Math.max(20, screenWidth * 0.065));

  // Measure tab bar height after render
  useEffect(() => {
    if (tabBarRef.current) {
      setTimeout(() => {
        tabBarRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (height && height > 0) {
            setTabBarHeight(height);
          }
        });
      }, 100);
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#f5e7e7",
          tabBarInactiveTintColor: "#ec3838cc",
          tabBarLabelPosition: "beside-icon",
          tabBarLabel: () => null,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            paddingBottom: Math.max(
              5,
              insets.bottom - 5 || screenHeight * 0.001,
            ),
            borderTopWidth: 0,
            elevation: 0,
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
              const textSize = getFontSize(focused ? 20 : 16);
              const verticalPadding = Math.max(8, screenHeight * 0.007);

              return (
                <Pressable
                  onPress={props.onPress}
                  style={{
                    flex: 1,
                    backgroundColor: "#e4abff73",
                    borderRadius: Math.max(20, screenWidth * 0.07),
                    marginHorizontal: Math.max(4, screenWidth * 0.01),
                    paddingVertical: verticalPadding,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AnimatedIcon focused={focused}>
                      <Icon
                        size={iconSize}
                        name="checklist"
                        color={focused ? "#9250fc" : "#580faada"}
                      />
                    </AnimatedIcon>
                    <Text
                      style={{
                        fontSize: textSize,
                        fontWeight: "700",
                        color: textColor,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      Schedules
                    </Text>
                  </View>
                </Pressable>
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
              const textColor = focused ? "#9250fc" : "#580faada";
              const textSize = getFontSize(focused ? 20 : 16);
              const verticalPadding = Math.max(8, screenHeight * 0.004);

              return (
                <Pressable
                  onPress={props.onPress}
                  style={{
                    flex: 1,
                    backgroundColor: "#e4abff73",
                    borderRadius: Math.max(20, screenWidth * 0.07),
                    marginHorizontal: Math.max(4, screenWidth * 0.01),
                    paddingVertical: verticalPadding,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AnimatedIcon focused={focused}>
                      <Icon
                        size={iconSize}
                        name="task"
                        color={focused ? "#932bf5" : "#580faada"}
                      />
                    </AnimatedIcon>
                    <Text
                      style={{
                        fontSize: textSize,
                        fontWeight: "700",
                        color: textColor,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      Tasks
                    </Text>
                  </View>
                </Pressable>
              );
            },
          }}
        />
      </Tabs>

      {/* Hidden view to measure tab bar */}
      <View
        ref={tabBarRef}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </View>
  );
}
