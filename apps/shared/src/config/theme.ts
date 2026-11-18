import { css } from 'styled-components';

const LANDSCAPE_BREAKPOINT = 450;

const breakpointNumbers = {
  sm: 768,
  md: 1024,
  lg: 1440,
};

const breakpoints = {
  sm: `@media (min-width: ${breakpointNumbers.sm}px) and (min-height: ${LANDSCAPE_BREAKPOINT}px)`,
  md: `@media (min-width: ${breakpointNumbers.md}px)`,
  lg: `@media (min-width: ${breakpointNumbers.lg}px)`,
} as const;

export const theme = {
  spacing: {
    50: 'var(--spacing-50)',
    100: 'var(--spacing-100)',
    150: 'var(--spacing-150)',
    200: 'var(--spacing-200)',
    300: 'var(--spacing-300)',
    400: 'var(--spacing-400)',
    600: 'var(--spacing-600)',
    800: 'var(--spacing-800)',
    1000: 'var(--spacing-1000)',
    1200: 'var(--spacing-1200)',
  },
  borderRadius: {
    100: 'var(--border-radius-100)',
    150: 'var(--border-radius-150)',
    200: 'var(--border-radius-200)',
    300: 'var(--border-radius-300)',
    400: 'var(--border-radius-400)',
    600: 'var(--border-radius-600)',
    800: 'var(--border-radius-800)',
    1000: 'var(--border-radius-1000)',
    full: 'var(--border-radius-full)',
  },
  borderWeight: {
    25: 'var(--border-weight-25)',
    50: 'var(--border-weight-50)',
    100: 'var(--border-weight-100)',
  },
  text: {
    // base font sizes
    displayXL: css`
      font-family: var(--font-family-title);
      font-size: var(--font-size-4xl);
      font-weight: 600;
      line-height: 115%;

      ${breakpoints.sm} {
        line-height: 110%;
      }
    `,
    displayL: css`
      font-family: var(--font-family-title);
      font-size: var(--font-size-3xl);
      font-weight: 600;
      line-height: 115%;
    `,
    H1: css`
      font-family: var(--font-family-title);
      font-size: var(--font-size-2xl);
      font-weight: 600;
      line-height: 120%;
    `,
    H2: css`
      font-family: var(--font-family-title);
      font-size: var(--font-size-xl);
      font-weight: 600;
      line-height: 125%;
    `,
    H3: css`
      font-family: var(--font-family-title);
      font-size: var(--font-size-lg);
      font-weight: 600;
      line-height: 135%;
    `,
    L: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-md);
      line-height: 160%;

      ${breakpoints.sm} {
        line-height: 155%;
      }
    `,
    M: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-base);
      line-height: 160%;

      ${breakpoints.sm} {
        line-height: 150%;
      }
    `,
    S: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      line-height: 145%;
    `,

    // expanded font sizes
    button: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-base);
      font-weight: 700;
      line-height: 150%;
      letter-spacing: 0.3px;
    `,
    label: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      font-weight: 700;
      line-height: 120%;
      letter-spacing: 0.3px;
    `,
    caption: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      line-height: 140%;
      letter-spacing: 0.25px;
    `,
    formLabel: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: 700;
      line-height: 140%;
      letter-spacing: 0.25px;
    `,
    formPlaceholder: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-base);
      line-height: 150%;
      letter-spacing: 0.3px;
    `,
    formMessage: css`
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      line-height: 140%;
      letter-spacing: 0.25px;
    `,
  },
  zIndex: {
    fullPageLoader: 10000,
    toast: 1500,
    dropdown: 1100,
    modal: 1000,
    banner: 100,
    raised: 10,
    base: 0,
    below: -10,
    bg: -1000,
  },
  colors: {
    surface: {
      default: 'var(--fill-surface-default)',
      weak: 'var(--fill-surface-weak)',
      medium: 'var(--fill-surface-medium)',
      stronger: 'var(--fill-surface-stronger)',
      darker: 'var(--fill-surface-darker)',
      brandPrimary: 'var(--fill-surface-brand-brand_primary)',
      brandSecondary: 'var(--fill-surface-brand-brand_secondary)',
      gradient: {
        start: 'var(--fill-surface-brand-gradient_start)',
        end: 'var(--fill-surface-brand-gradient_end)',
      },
    },
    overlay: 'var(--fill-overlay-backdrop)',
    primary: {
      default: 'var(--fill-controls-primary-default)',
      hover: 'var(--fill-controls-primary-hover)',
      active: 'var(--fill-controls-primary-active)',
    },
    secondary: {
      default: 'var(--fill-controls-secondary-default)',
      hover: 'var(--fill-controls-secondary-hover)',
      active: 'var(--fill-controls-secondary-active)',
    },
    tertiary: {
      default: 'var(--fill-controls-tertiary-default)',
      hover: 'var(--fill-controls-tertiary-hover)',
      active: 'var(--fill-controls-tertiary-active)',
    },
    destructive: {
      default: 'var(--fill-controls-destructive-default)',
      hover: 'var(--fill-controls-destructive-hover)',
      active: 'var(--fill-controls-destructive-active)',
    },
    disabled: 'var(--fill-controls-disabled-disabled)',
    neutral: {
      default: 'var(--fill-status-neutral-default)',
      stronger: 'var(--fill-status-neutral-stronger)',
      inverted: 'var(--fill-status-neutral-inverted)',
    },
    success: {
      default: 'var(--fill-status-success-default)',
      stronger: 'var(--fill-status-success-stronger)',
      inverted: 'var(--fill-status-success-inverted)',
    },
    info: {
      default: 'var(--fill-status-info-default)',
      stronger: 'var(--fill-status-info-stronger)',
      inverted: 'var(--fill-status-info-inverted)',
    },
    warning: {
      default: 'var(--fill-status-warning-default)',
      stronger: 'var(--fill-status-warning-stronger)',
      inverted: 'var(--fill-status-warning-inverted)',
    },
    error: {
      default: 'var(--fill-status-error-default)',
      stronger: 'var(--fill-status-error-stronger)',
      inverted: 'var(--fill-status-error-inverted)',
    },
    border: {
      default: 'var(--border-neutral-default)',
      input: {
        default: 'var(--border-input-default)',
        hover: 'var(--border-input-hover)',
        active: 'var(--border-input-active)',
      },
      primary: {
        default: 'var(--border-controls-primary-default)',
        hover: 'var(--border-controls-primary-hover)',
        active: 'var(--border-controls-primary-active)',
      },
      secondary: {
        default: 'var(--border-controls-secondary-default)',
        hover: 'var(--border-controls-secondary-hover)',
        active: 'var(--border-controls-secondary-active)',
      },
      destructive: {
        default: 'var(--border-controls-destructive-default)',
        hover: 'var(--border-controls-destructive-hover)',
        active: 'var(--border-controls-destructive-active)',
      },
      disabled: 'var(--border-controls-disabled-disabled)',
      neutral: {
        default: 'var(--border-status-neutral-default)',
        muted: 'var(--border-status-neutral-muted)',
        inverted: 'var(--border-status-neutral-inverted)',
      },
      loader: {
        indicator: 'var(--border-status-loader_indicator)',
        indicatorBrand: 'var(--border-status-loader_indicator_brand)',
        indicatorInverse: 'var(--border-status-loader_indicator_inverse)',
        background: 'var(--border-status-loader_bg)',
        backgroundBrand: 'var(--border-status-loader_bg_brand)',
        backgroundInverse: 'var(--border-status-loader_bg_inverse)',
      },
      success: {
        default: 'var(--border-status-success-default)',
        muted: 'var(--border-status-success-muted)',
        inverted: 'var(--border-status-success-inverted)',
      },
      info: {
        default: 'var(--border-status-info-default)',
        muted: 'var(--border-status-info-muted)',
        inverted: 'var(--border-status-info-inverted)',
      },
      warning: {
        default: 'var(--border-status-warning-default)',
        muted: 'var(--border-status-warning-muted)',
        inverted: 'var(--border-status-warning-inverted)',
      },
      error: {
        default: 'var(--border-status-error-default)',
        muted: 'var(--border-status-error-muted)',
        inverted: 'var(--border-status-error-inverted)',
      },
    },
    text: {
      brand: 'var(--text-brand)',
      default: 'var(--text-primary-default)',
      inverted: 'var(--text-primary-inverted)',
      secondary: 'var(--text-secondary-default)',
      assistive: 'var(--text-secondary-assistive)',
      disabled: 'var(--text-disabled-disabled)',
      muted: 'var(--text-disabled-muted)',
      link: {
        default: 'var(--text-link-default)',
        hover: 'var(--text-link-hover)',
        active: 'var(--text-link-active)',
      },
      neutral: {
        default: 'var(--text-status-neutral-default)',
        darker: 'var(--text-status-neutral-darker)',
      },
      success: 'var(--text-status-success-default)',
      successDarker: 'var(--text-status-success-darker)',
      info: 'var(--text-status-info-default)',
      infoDarker: 'var(--text-status-info-darker)',
      warning: 'var(--text-status-warning-default)',
      warningDarker: 'var(--text-status-warning-darker)',
      danger: 'var(--text-status-danger-default)',
      dangerDarker: 'var(--text-status-danger-darker)',
    },
    icon: {
      brand: 'var(--icon-brand_primary)',
      brandHover: 'var(--icon-brand_primary_hover)',
      brandActive: 'var(--icon-brand_primary_active)',
      brandSecondary: 'var(--icon-brand_secondary)',
      default: 'var(--icon-primary-default)',
      inverted: 'var(--icon-primary-inverted)',
      secondary: 'var(--icon-secondary-default)',
      assistive: 'var(--icon-secondary-assistive)',
      disabled: 'var(--icon-disabled-disabled)',
      link: {
        default: 'var(--icon-link-default)',
        hover: 'var(--icon-link-hover)',
        active: 'var(--icon-link-active)',
      },
      status: {
        default: 'var(--icon-status-default)',
        hover: 'var(--icon-status-hover)',
        active: 'var(--icon-status-active)',
      },
      neutral: {
        default: 'var(--icon-status-neutral-default)',
        darker: 'var(--icon-status-neutral-darker)',
      },
      success: 'var(--icon-status-success-default)',
      successDarker: 'var(--icon-status-success-darker)',
      info: 'var(--icon-status-info-default)',
      infoDarker: 'var(--icon-status-info-darker)',
      warning: 'var(--icon-status-warning-default)',
      warningDarker: 'var(--icon-status-warning-darker)',
      danger: 'var(--icon-status-danger-default)',
      dangerDarker: 'var(--icon-status-danger-darker)',
    },
  },
  breakpointNumbers,
  breakpoints,
} as const;
