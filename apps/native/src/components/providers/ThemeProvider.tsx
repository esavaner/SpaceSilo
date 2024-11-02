import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { themes } from '@repo/tailwind/themes';

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme('dark');
  }, []);

  return (
    <View style={themes[colorScheme ?? 'dark']} className="flex-1">
      {children}
    </View>
  );
};
