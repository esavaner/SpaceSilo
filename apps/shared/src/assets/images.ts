// shortcut: inline placeholder SVGs for the original image assets, replace with real files later
// base64 keeps them valid inside unquoted CSS url()
const svg = (markup: string) => `data:image/svg+xml;base64,${btoa(markup)}`;

export const NoiseImage = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
);

export const ShapesAnimationImage = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="90" cy="110" r="60" fill="#fff" fill-opacity="0.08"/><rect x="230" y="230" width="120" height="120" rx="24" fill="#fff" fill-opacity="0.08"/></svg>`
);

export const CircleImage = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="none"><ellipse cx="100" cy="50" rx="96" ry="44" fill="none" stroke="#448b7e" stroke-width="3"/></svg>`
);

export const UnderlineImage = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 20"><path d="M2 14 Q50 2 100 10 T198 8" fill="none" stroke="#448b7e" stroke-width="4" stroke-linecap="round"/></svg>`
);
