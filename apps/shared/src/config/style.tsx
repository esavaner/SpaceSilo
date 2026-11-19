import { createGlobalStyle, css } from 'styled-components';

import { theme } from './theme';
import { NoiseImage } from '../assets/images';
import { fonts } from './fonts';

export const globalStyleBase = css`
  ${fonts}

  *,
  *:before,
  *:after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
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
    font-family: ${theme.family.body}, sans-serif;
    background-color: ${theme.colors.surface.medium};
    color: ${theme.colors.text.default};
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
  }

  a {
    color: inherit;
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
