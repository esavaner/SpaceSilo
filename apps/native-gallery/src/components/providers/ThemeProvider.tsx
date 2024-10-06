import React, { createContext } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { themes } from '@repo/tailwind/themes';

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeContext = createContext<{
  theme: 'light' | 'dark' | undefined;
}>({
  theme: 'dark',
});

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { colorScheme } = useColorScheme();
  return (
    <ThemeContext.Provider value={{ theme: colorScheme }}>
      <View style={themes[colorScheme ?? 'dark']} className="flex-1">
        {children}
      </View>
    </ThemeContext.Provider>
  );
};
