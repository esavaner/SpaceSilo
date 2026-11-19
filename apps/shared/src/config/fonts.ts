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

export const fonts = [
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
