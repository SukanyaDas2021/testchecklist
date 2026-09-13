import React, { createContext, useContext, useState } from "react";
import { LayoutChangeEvent } from "react-native";

interface TabBarContextType {
  tabBarHeight: number;
  setTabBarHeight: (height: number) => void;
  onTabBarLayout: (event: LayoutChangeEvent) => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tabBarHeight, setTabBarHeight] = useState(0);

  const onTabBarLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height !== tabBarHeight) {
      setTabBarHeight(height);
    }
  };

  return (
    <TabBarContext.Provider
      value={{ tabBarHeight, setTabBarHeight, onTabBarLayout }}
    >
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error("useTabBar must be used within TabBarProvider");
  }
  return context;
};
