import { createGlobalStyle, css } from 'styled-components';

import { theme } from './theme';
import { NoiseImage } from '../assets/images';

const LatoBlack = new URL('../assets/fonts/Lato/Lato-Black.woff2', import.meta.url).href;
const LatoBlackItalic = new URL('../assets/fonts/Lato/Lato-BlackItalic.woff2', import.meta.url).href;
const LatoBold = new URL('../assets/fonts/Lato/Lato-Bold.woff2', import.meta.url).href;
const LatoBoldItalic = new URL('../assets/fonts/Lato/Lato-BoldItalic.woff2', import.meta.url).href;
const LatoItalic = new URL('../assets/fonts/Lato/Lato-Italic.woff2', import.meta.url).href;
const LatoLight = new URL('../assets/fonts/Lato/Lato-Light.woff2', import.meta.url).href;
const LatoLightItalic = new URL('../assets/fonts/Lato/Lato-LightItalic.woff2', import.meta.url).href;
const LatoRegular = new URL('../assets/fonts/Lato/Lato-Regular.woff2', import.meta.url).href;
const LatoThin = new URL('../assets/fonts/Lato/Lato-Thin.woff2', import.meta.url).href;
const LatoThinItalic = new URL('../assets/fonts/Lato/Lato-ThinItalic.woff2', import.meta.url).href;
const LoraVariable = new URL('../assets/fonts/Lora/Lora-VariableFont_wght.woff2', import.meta.url).href;
const LoraVariableItalic = new URL('../assets/fonts/Lora/Lora-Italic-VariableFont_wght.woff2', import.meta.url).href;

const size = css`
  --spacing-50: 2px;
  --spacing-100: 4px;
  --spacing-150: 6px;
  --spacing-200: 8px;
  --spacing-300: 12px;
  --spacing-400: 16px;
  --spacing-600: 24px;
  --spacing-800: 32px;
  --spacing-1000: 40px;
  --spacing-1200: 48px;

  --border-radius-100: 4px;
  --border-radius-150: 6px;
  --border-radius-200: 8px;
  --border-radius-300: 12px;
  --border-radius-400: 16px;
  --border-radius-600: 24px;
  --border-radius-800: 32px;
  --border-radius-1000: 40px;
  --border-radius-full: 999px;

  --border-weight-25: 1px;
  --border-weight-50: 2px;
  --border-weight-100: 4px;

  --blur-25: 4px;
  --blur-200: 8px;
  --blur-300: 12px;
  --blur-400: 16px;
  --blur-600: 24px;
  --blur-800: 32px;
  --blur-1000: 40px;
`;

const fontSize = css`
  --font-family-title: Lora, serif;
  --font-family-body: Lato, sans-serif;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;

  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-3xl: 2.25rem;
  --font-size-4xl: 2.625rem;

  ${theme.breakpoints.sm} {
    --font-size-md: 1.125rem;
    --font-size-lg: 1.375rem;
    --font-size-xl: 1.75rem;
    --font-size-2xl: 2.25rem;
    --font-size-3xl: 3rem;
    --font-size-4xl: 3.5rem;
  }

  ${theme.breakpoints.md} {
    --font-size-md: 1.125rem;
    --font-size-lg: 1.5rem;
    --font-size-xl: 2rem;
    --font-size-2xl: 2.5rem;
    --font-size-3xl: 3.5rem;
    --font-size-4xl: 4.375rem;
  }
`;

const colors = css`
  --base-white: #ffffff;
  --base-white-20: #ffffff33;
  --base-black: #000000;

  --teal-50: #f4fbfa;
  --teal-100: #eef8f6;
  --teal-200: #c0e2de;
  --teal-300: #97c8c1;
  --teal-400: #6aaa9f;
  --teal-500: #448b7e;
  --teal-600: #307467;
  --teal-600-08: #30746714;
  --teal-700: #235a50;
  --teal-800: #0d2a25;
  --teal-900: #0d2a25;

  --brown-50: #fdfbf9;
  --brown-100: #f7f3f0;
  --brown-200: #efede9;
  --brown-300: #e8ddd6;
  --brown-400: #c4b8b1;
  --brown-500: #a99b93;
  --brown-600: #8c7e76;
  --brown-700: #6b5d55;
  --brown-800: #3f2c26;
  --brown-900: #2f2520;
  --brown-900-80: #2f2520cc;

  --blush-50: #fef9f7;
  --blush-100: #fdf6f4;
  --blush-200: #f5e7e2;
  --blush-300: #edd3c9;
  --blush-400: #e5beb0;
  --blush-500: #d4907e;
  --blush-600: #c26b54;
  --blush-700: #9c4a35;
  --blush-800: #6b2e1f;
  --blush-900: #3d1a10;

  --slate-50: #f8f9fb;
  --slate-100: #eeeff2;
  --slate-200: #e5e7eb;
  --slate-300: #d0d5de;
  --slate-400: #b8bfcc;
  --slate-500: #99a1af;
  --slate-600: #4b5a6e;
  --slate-700: #2e3a4e;
  --slate-800: #1c2333;
  --slate-900: #0f1117;

  --green-50: #e0f4e7;
  --green-100: #d7f1e0;
  --green-200: #bce7cd;
  --green-300: #92d9b2;
  --green-400: #5fc794;
  --green-500: #38a77b;
  --green-600: #1f866f;
  --green-700: #10655e;
  --green-800: #094d4d;
  --green-900: #074244;

  --blue-50: #f1f7f9;
  --blue-100: #e8f2f5;
  --blue-200: #cee2ea;
  --blue-300: #a7c6da;
  --blue-400: #76a0c6;
  --blue-500: #4573b0;
  --blue-600: #294c92;
  --blue-700: #182e74;
  --blue-800: #0f1e5d;
  --blue-900: #0c1955;

  --purple-50: #f7f4fb;
  --purple-100: #f0eaf7;
  --purple-200: #ddd0ee;
  --purple-300: #c2aade;
  --purple-400: #a17ecb;
  --purple-500: #7f53b4;
  --purple-600: #613a95;
  --purple-700: #492a77;
  --purple-800: #351d5c;
  --purple-900: #2b1750;

  --yellow-50: #fefbfa;
  --yellow-100: #fcf3ef;
  --yellow-200: #f6ddd1;
  --yellow-300: #ecc0a3;
  --yellow-400: #dfa56b;
  --yellow-500: #d5932e;
  --yellow-600: #b18417;
  --yellow-700: #8e720b;
  --yellow-800: #756306;
  --yellow-900: #6c5d04;

  --red-50: #fefbfc;
  --red-100: #fceef4;
  --red-200: #f6d0df;
  --red-300: #eca2b3;
  --red-400: #e26a70;
  --red-500: #d73e2d;
  --red-600: #b11e16;
  --red-700: #8f0e0a;
  --red-800: #760705;
  --red-900: #6c0604;

  /* fill ********************************************************************/

  --fill-surface-default: var(--brown-50);
  --fill-surface-weak: var(--base-white);
  --fill-surface-medium: var(--brown-100);
  --fill-surface-stronger: var(--brown-200);
  --fill-surface-darker: var(--brown-300);

  --fill-surface-brand-brand_primary: var(--teal-600);
  --fill-surface-brand-brand_weak: var(--teal-600-08);
  --fill-surface-brand-brand_secondary: #f1786c;
  --fill-surface-brand-gradient_start: var(--teal-500);
  --fill-surface-brand-gradient_end: var(--teal-400);

  --fill-overlay-backdrop: var(--brown-900-80);

  --fill-controls-primary-default: var(--teal-600);
  --fill-controls-primary-hover: var(--teal-700);
  --fill-controls-primary-active: var(--teal-800);

  --fill-controls-secondary-default: var(--base-white);
  --fill-controls-secondary-hover: var(--blush-400);
  --fill-controls-secondary-active: var(--blush-500);

  --fill-controls-tertiary-default: var(--base-white);
  --fill-controls-tertiary-hover: var(--slate-100);
  --fill-controls-tertiary-active: var(--slate-300);

  --fill-controls-destructive-default: var(--red-500);
  --fill-controls-destructive-hover: var(--red-600);
  --fill-controls-destructive-active: var(--red-700);

  --fill-controls-disabled-disabled: var(--slate-100);

  --fill-status-neutral-default: var(--brown-50);
  --fill-status-neutral-stronger: var(--brown-100);
  --fill-status-neutral-inverted: var(--brown-500);

  --fill-status-success-default: var(--green-50);
  --fill-status-success-stronger: var(--green-200);
  --fill-status-success-inverted: var(--green-500);

  --fill-status-info-default: var(--blue-50);
  --fill-status-info-stronger: var(--blue-200);
  --fill-status-info-inverted: var(--blue-500);

  --fill-status-warning-default: var(--yellow-50);
  --fill-status-warning-stronger: var(--yellow-200);
  --fill-status-warning-inverted: var(--yellow-500);

  --fill-status-error-default: var(--red-50);
  --fill-status-error-stronger: var(--red-100);
  --fill-status-error-inverted: var(--red-500);

  /* border ******************************************************************/

  --border-neutral-default: var(--brown-300);

  --border-input-default: var(--brown-300);
  --border-input-hover: var(--brown-700);
  --border-input-active: var(--brown-700);

  --border-controls-primary-default: var(--teal-600);
  --border-controls-primary-hover: var(--teal-700);
  --border-controls-primary-active: var(--teal-800);

  --border-controls-secondary-default: var(--blush-400);
  --border-controls-secondary-hover: var(--blush-400);
  --border-controls-secondary-active: var(--blush-500);

  --border-controls-destructive-default: var(--red-500);
  --border-controls-destructive-hover: var(--red-600);
  --border-controls-destructive-active: var(--red-700);

  --border-controls-disabled-disabled: var(--slate-200);

  --border-status-neutral-default: var(--brown-500);
  --border-status-neutral-muted: var(--brown-300);
  --border-status-neutral-inverted: var(--brown-100);

  --border-status-success-default: var(--green-500);
  --border-status-success-muted: var(--green-300);
  --border-status-success-inverted: var(--green-50);

  --border-status-info-default: var(--blue-500);
  --border-status-info-muted: var(--blue-300);
  --border-status-info-inverted: var(--blue-50);

  --border-status-warning-default: var(--yellow-500);
  --border-status-warning-muted: var(--yellow-300);
  --border-status-warning-inverted: var(--yellow-50);

  --border-status-error-default: var(--red-500);
  --border-status-error-muted: var(--red-300);
  --border-status-error-inverted: var(--red-50);

  --border-status-loader_indicator: var(--base-white);
  --border-status-loader_indicator_brand: var(--teal-600);
  --border-status-loader_indicator_inverse: var(--brown-800);
  --border-status-loader_bg: var(--base-white-20);
  --border-status-loader_bg_brand: var(--teal-100);
  --border-status-loader_bg_inverse: var(--brown-100);

  /* text ********************************************************************/

  --text-brand: var(--teal-600);

  --text-primary-default: var(--brown-900);
  --text-primary-inverted: var(--base-white);

  --text-secondary-default: var(--brown-700);
  --text-secondary-assistive: var(--brown-600);

  --text-disabled-disabled: var(--slate-600);
  --text-disabled-muted: var(--slate-500);

  --text-link-default: var(--teal-600);
  --text-link-hover: var(--teal-700);
  --text-link-active: var(--teal-800);

  --text-status-neutral-default: var(--brown-500);
  --text-status-neutral-darker: var(--brown-700);

  --text-status-success-default: var(--green-500);
  --text-status-success-darker: var(--green-700);

  --text-status-info-default: var(--blue-500);
  --text-status-info-darker: var(--blue-700);

  --text-status-warning-default: var(--yellow-500);
  --text-status-warning-darker: var(--yellow-700);

  --text-status-danger-default: var(--red-500);
  --text-status-danger-darker: var(--red-700);

  /* icon ********************************************************************/

  --icon-brand_primary: var(--teal-600);
  --icon-brand_primary_hover: var(--teal-700);
  --icon-brand_primary_active: var(--teal-800);
  --icon-brand_secondary: #f1786c;

  --icon-primary-default: var(--brown-900);
  --icon-primary-inverted: var(--base-white);

  --icon-secondary-default: var(--brown-700);
  --icon-secondary-assistive: var(--brown-600);

  --icon-disabled-disabled: var(--slate-600);

  --icon-link-default: var(--teal-600);
  --icon-link-hover: var(--teal-700);
  --icon-link-active: var(--teal-800);

  --icon-status-default: var(--brown-300);
  --icon-status-hover: var(--brown-700);
  --icon-status-active: var(--brown-700);

  --icon-status-neutral-default: var(--brown-500);
  --icon-status-neutral-darker: var(--brown-700);

  --icon-status-success-default: var(--green-500);
  --icon-status-success-darker: var(--green-700);

  --icon-status-info-default: var(--blue-500);
  --icon-status-info-darker: var(--blue-700);

  --icon-status-warning-default: var(--yellow-500);
  --icon-status-warning-darker: var(--yellow-700);

  --icon-status-danger-default: var(--red-500);
  --icon-status-danger-darker: var(--red-700);
`;

const lato = [
  {
    family: 'Lato',
    src: LatoThin,
    weight: 100,
    style: 'normal',
  },
  {
    family: 'Lato',
    src: LatoThinItalic,
    weight: 100,
    style: 'italic',
  },
  {
    family: 'Lato',
    src: LatoLight,
    weight: 300,
    style: 'normal',
  },
  {
    family: 'Lato',
    src: LatoLightItalic,
    weight: 300,
    style: 'italic',
  },
  {
    family: 'Lato',
    src: LatoRegular,
    weight: 400,
    style: 'normal',
  },
  {
    family: 'Lato',
    src: LatoItalic,
    weight: 400,
    style: 'italic',
  },
  {
    family: 'Lato',
    src: LatoBold,
    weight: 700,
    style: 'normal',
  },
  {
    family: 'Lato',
    src: LatoBoldItalic,
    weight: 700,
    style: 'italic',
  },
  {
    family: 'Lato',
    src: LatoBlack,
    weight: 900,
    style: 'normal',
  },
  {
    family: 'Lato',
    src: LatoBlackItalic,
    weight: 900,
    style: 'italic',
  },
];

const fonts = [
  ...lato.map(
    (font) => `
			@font-face {
				font-family: "${font.family}";
				src: url(${font.src}) format("woff2");
				font-weight: ${font.weight};
				font-style: ${font.style};
				font-display: swap;
			}
		`
  ),
  `
		@font-face {
			font-family: "Lora";
			src: url(${LoraVariable}) format("woff2");
			font-weight: 400 700;
			font-style: normal;
			font-display: swap;
		}
	`,
  `
		@font-face {
			font-family: "Lora";
			src: url(${LoraVariableItalic}) format("woff2");
			font-weight: 400 700;
			font-style: italic;
			font-display: swap;
		}
	`,
].join('\n');

export const globalStyleBase = css`
  ${fonts}

  :root {
    ${fontSize ?? ''}
    ${size ?? ''}
    ${colors ?? ''}
  }

  *,
  *:before,
  *:after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
  }

  html {
    font-size: 100%;
    min-height: 100svh;
    width: 100%;
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
    -webkit-touch-callout: none;
  }

  body {
    min-height: 100svh;
    width: 100%;
    line-height: 1.5rem;
    font-family: 'Lato', sans-serif;
    background-color: var(--fill-surface-medium);
    color: var(--text-primary-default);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-smooth: never;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url(${NoiseImage});
      background-repeat: repeat;
      opacity: 0.03;
      pointer-events: none;
      z-index: ${theme.zIndex.bg};
    }
  }

  #root {
    min-height: 100svh;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    /* force font family, covers the app from inheriting other styles */
    font-family: var(--font-family-body) !important;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    border: 0;
    outline: none;
    background: 0 0;
    cursor: pointer;
    -webkit-appearance: button;
    appearance: button;
    font: inherit;
  }
`;

export const GlobalStyle = createGlobalStyle`
	${globalStyleBase}
`;
