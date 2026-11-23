import type { CSSProperties } from 'react';
import { Toaster as SonnerToaster, toast, type ToasterProps } from 'sonner';
import { Icon } from '../assets/icons';
import { theme, useThemeColors, useThemeMode } from '../config/theme';

type ToastCssProperties = CSSProperties & Record<`--${string}`, string>;

export const Toaster = ({
  closeButton,
  icons,
  richColors,
  style,
  theme: themeProp,
  toastOptions,
  ...rest
}: ToasterProps) => {
  const colors = useThemeColors();
  const { scheme } = useThemeMode();
  const themedStyle: ToastCssProperties = {
    fontFamily: theme.family.body,
    '--border-radius': theme.radius[300],
    '--normal-bg': colors.surface.weak,
    '--normal-border': colors.border.default,
    '--normal-text': colors.text.default,
    '--success-bg': colors.success.default,
    '--success-border': colors.border.success.default,
    '--success-text': colors.text.successDarker,
    '--info-bg': colors.info.default,
    '--info-border': colors.border.info.default,
    '--info-text': colors.text.infoDarker,
    '--warning-bg': colors.warning.default,
    '--warning-border': colors.border.warning.default,
    '--warning-text': colors.text.warningDarker,
    '--error-bg': colors.error.default,
    '--error-border': colors.border.error.default,
    '--error-text': colors.text.dangerDarker,
    ...style,
  };

  return (
    <SonnerToaster
      {...rest}
      closeButton={closeButton}
      icons={{
        success: <Icon.CircleCheckBig size={20} color={colors.text.successDarker} aria-hidden />,
        error: <Icon.OctagonExclamationPoint size={20} color={colors.text.dangerDarker} aria-hidden />,
        warning: <Icon.TriangleExclamationPoint size={20} color={colors.text.warningDarker} aria-hidden />,
        info: <Icon.Info size={20} color={colors.text.infoDarker} aria-hidden />,
        close: <Icon.X size={14} color={colors.text.secondary} aria-hidden />,
        ...icons,
      }}
      richColors={richColors ?? true}
      style={themedStyle}
      theme={themeProp ?? scheme}
      toastOptions={{
        ...toastOptions,
        style: {
          borderRadius: theme.radius[300],
          fontFamily: theme.family.body,
          ...toastOptions?.style,
        },
        actionButtonStyle: {
          color: colors.text.inverted,
          background: colors.primary.default,
          borderRadius: theme.radius[200],
          ...toastOptions?.actionButtonStyle,
        },
        cancelButtonStyle: {
          color: colors.text.secondary,
          background: colors.surface.stronger,
          borderRadius: theme.radius[200],
          ...toastOptions?.cancelButtonStyle,
        },
      }}
    />
  );
};

export { toast };
export type { ToasterProps } from 'sonner';
