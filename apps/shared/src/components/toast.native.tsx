import { Toaster as SonnerToaster, toast, type ToasterProps } from 'sonner-native';
import { Icon } from '../assets/icons';
import { theme, useThemeColors, useThemeMode } from '../config/theme';

const radius = Number.parseFloat(theme.radius[300]);
const borderWeight = Number.parseFloat(theme.borderWeight[25]);

export const Toaster = ({ closeButton, icons, richColors, theme: themeProp, toastOptions, ...rest }: ToasterProps) => {
  const colors = useThemeColors();
  const { scheme } = useThemeMode();

  return (
    <SonnerToaster
      {...rest}
      closeButton={closeButton}
      icons={{
        success: <Icon.CircleCheckBig size={20} color={colors.text.successDarker} aria-hidden />,
        error: <Icon.OctagonExclamationPoint size={20} color={colors.text.dangerDarker} aria-hidden />,
        warning: <Icon.TriangleExclamationPoint size={20} color={colors.text.warningDarker} aria-hidden />,
        info: <Icon.Info size={20} color={colors.text.infoDarker} aria-hidden />,
        ...icons,
      }}
      richColors={richColors ?? false}
      theme={themeProp ?? scheme}
      toastOptions={{
        ...toastOptions,
        style: {
          borderRadius: radius,
          borderWidth: borderWeight,
          borderColor: colors.border.default,
          backgroundColor: colors.surface.weak,
          ...toastOptions?.style,
        },
        titleStyle: { color: colors.text.default, ...toastOptions?.titleStyle },
        descriptionStyle: { color: colors.text.secondary, ...toastOptions?.descriptionStyle },
        actionButtonStyle: {
          borderRadius: radius,
          borderColor: colors.border.primary.default,
          backgroundColor: colors.primary.default,
          ...toastOptions?.actionButtonStyle,
        },
        actionButtonTextStyle: {
          color: colors.text.inverted,
          ...toastOptions?.actionButtonTextStyle,
        },
        cancelButtonTextStyle: {
          color: colors.text.secondary,
          ...toastOptions?.cancelButtonTextStyle,
        },
        success: {
          borderColor: colors.border.success.default,
          backgroundColor: colors.success.default,
          ...toastOptions?.success,
        },
        error: {
          borderColor: colors.border.error.default,
          backgroundColor: colors.error.default,
          ...toastOptions?.error,
        },
        warning: {
          borderColor: colors.border.warning.default,
          backgroundColor: colors.warning.default,
          ...toastOptions?.warning,
        },
        info: {
          borderColor: colors.border.info.default,
          backgroundColor: colors.info.default,
          ...toastOptions?.info,
        },
        loading: {
          borderColor: colors.border.info.default,
          backgroundColor: colors.info.default,
          ...toastOptions?.loading,
        },
      }}
    />
  );
};

export { toast };
export type { ToasterProps } from 'sonner-native';
