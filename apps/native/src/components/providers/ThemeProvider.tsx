import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { themes } from '@repo/tailwind/themes';

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { colorScheme } = useColorScheme();
  return (
    <View style={themes[colorScheme ?? 'dark']} className="flex-1 bg-base-800">
      {children}
    </View>
  );
};
