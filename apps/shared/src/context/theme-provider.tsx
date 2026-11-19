import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from 'styled-components/native';
import { darkColors, lightColors, type ThemeColors } from '../config/colors';
import { ThemeModeContext, themeTokens, type ThemeMode } from '../config/theme';

type ThemeModeProviderProps = {
  children?: React.ReactNode;
  initialMode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
};

export const ThemeModeProvider = ({ children, initialMode = 'system', onModeChange }: ThemeModeProviderProps) => {
  const [mode, setModeState] = useState(initialMode);
  const system = useColorScheme();
  const scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    onModeChange?.(next);
  };

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, scheme, colors }}>
      <ThemeProvider theme={{ colors }}>
        <themeTokens.GlobalStyle />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

declare module 'styled-components/native' {
  interface DefaultTheme {
    colors: ThemeColors;
  }
}
