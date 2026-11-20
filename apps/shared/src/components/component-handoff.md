# Handoff: native-first shared components (SpaceSilo)

## Goal

Convert UI components in `apps/shared/src/components` from their original plain React web version to native-first React Native components. They then compile back to web through react-native-web.

- **Native first is the most important rule.** The components must work correctly on a real Expo device.
- **Web must still work.** These components were already tested on web, so keep their web behavior and visual design. Web-only extras (hover, cursor, outline, resize, and so on) can stay as bonus behavior.
- **One component per file.** Don't split components into `.native.tsx` and `.web.tsx` files. `text.tsx` is the reference example.
- Use `styled-components/native` (styled-components 7 prerelease). If a style or prop isn't supported on one platform but doesn't cause an error, keep it.
- Ignore `apps/docs`.
- Use the ponytail skill: make the smallest complete change, and end each reply with what was skipped or remains risky.

## Status

Done and tested on a real device by the user:

- `text.tsx`
- `input.tsx`
- `password-input.tsx`
- `textarea.tsx`, a multiline wrapper around `Input`
- `set-password-input.tsx`, which supports both controlled and uncontrolled values
- `loader.tsx`
- `checkbox.tsx`, including `hideLabel` for icon-only selection controls that retain an accessible label
- `phone-input.tsx`
- `radio.tsx` and `radio-group.tsx`
- `overflow-fade`,
- `button`,
- `pagination`,
- `modal.tsx`, including the context lifecycle, fixed title/buttons, and synchronized web backdrop blur/dimming
  `dropdown` and `select`

## SideDrawer

Import `SideDrawer` from `@repo/shared/components`. Pass `open` from caller state, `panel` for drawer content, and `children` for the main content. Any button can update `open`; set its expanded accessibility state. `side` defaults to `left`, `mode` to `push`, and `width` to 260. Push drawers animate within the layout they wrap. Overlay drawers can omit `children`: they slide over the full viewport and use the modal backdrop (blur and dim on web, dim on native). Pass `onClose` to set `open` to `false` on backdrop press, Escape, or Android Back, and include a close button in the panel. Drawers can nest and keep independent state; the panel unmounts after closing.

## Workflow for each component

1. Rewrite the component as a single file using React Native primitives, styled with `styled-components/native`.
2. Add an export for it in `apps/shared/package.json` if it doesn't have one. These exports point to `dist`.
3. Rebuild shared, because native uses `dist`:
   - `pnpm.cmd --filter @repo/shared exec tsc -p tsconfig.json --emitDeclarationOnly --incremental false`
   - `pnpm.cmd --filter @repo/shared exec swc src -d dist --strip-leading-paths --copy-files`
4. Add examples to the test page `apps/native/src/app/(tabs)/index.tsx`, including normal, error, and disabled states where they apply.
   - **The test page must not use translations.** A comment at the top of the file says so.
   - The page uses a white background.
5. Check the change once, after all edits are done (not after every edit):
   - `pnpm.cmd --filter @repo/shared typecheck`
   - `pnpm.cmd --filter @repo/native typecheck`
   - Run `eslint` and `prettier` on the files you changed.
   - **Leave manual and visual testing to the user.** By default, don't start Expo/web servers, open a browser, or run Playwright. The user tests on web and on a real device, so tell them what to check. Exception: for a web-only bug, or if the user asks, do one quick browser check and then stop.
   - Run `pnpm.cmd --filter @repo/native exec expo export --platform android` only after changing dependencies, package exports, or Metro/Babel config.

Use `pnpm.cmd` in Windows PowerShell.

## Lessons learned

These are gotchas found while converting components:

- **Focus and active states on native:** pseudo-selectors alone were not reliable on a device. `Input` tracks `isFocused` and `isPressed` in state and passes `$isActive` to the styles, only when the platform isn't web. On web, CSS `:focus` and `:hover` still apply.
- **Vertically centering absolute children:** don't use `top: Npx` with `translateY(-50%)`. Native doesn't center reliably that way. Put the children inside a container with `position: relative; justify-content: center`, leave out `top` and `bottom`, and set only `left` or `right`. `InputField` in `input.tsx` does this.
- **Complex selectors:** selectors like `& > svg` and `*` are ignored on native, with a dev warning. They're fine to keep as web-only styling. Pass colors to icons as props instead.
- **Disabled inputs on web:** react-native-web only turns `editable={false}` into `readOnly`. Also pass `disabled` on web only: `...(Platform.OS === 'web' ? { disabled } : {})`.
- **Textarea resizing on web:** react-native-web's multiline `TextInput` defaults to `resize: none`. Set `resize: vertical` explicitly.
- **Taps on web:** react-native-web's `TextInput` doesn't fire `onPress`. Wrap it in `<Pressable accessible={false}>`.
- **Icons:** add Lucide icons to `apps/shared/src/assets/icons.ts` under their original names. Import `Icon` from `@repo/shared/components` in apps and render icons as `<Icon.Eye />`. Don't pass `accessible={false}` to an SVG icon, because it causes a DOM warning on web. `aria-hidden` is fine.
- **Accessibility props:** use `role`, `aria-*`, and `accessibilityLabel`/`accessibilityState`. react-native-web maps them to the DOM.
- **Modal backdrop hit testing:** use a plain React Native `View` with `pointerEvents="box-none"` for the positioning layer. The styled View dropped that prop on web, blocking backdrop presses.
- **Taps inside an inline Modal while the keyboard is open:** RN Modal touches still bubble through the React ancestors. A page `ScrollView` with the default `keyboardShouldPersistTaps="never"` takes the first tap just to close the keyboard. `BaseLayout` now defaults it to `"handled"`. Other page-level ScrollViews hosting Select need the same setting.
- **Desktop Dropdown and Select:** the shared menu uses an anchored browser top-layer popover to escape parent clipping and stacking contexts. Set each inset explicitly: the browser's default popover `left: 0` otherwise overrides right alignment. Browsers without popover or CSS anchor support use the shared Modal instead.
- **Pressable style functions on web:** styled-components/native drops `style={({ pressed }) => ...}` on react-native-web. Put persistent state (selected, disabled) in transient props in the CSS. Keep the style function only for native pressed feedback, and return `null` when not pressed; an `undefined` value overrides the CSS.
- **Lucide icons on web use `currentColor`,** which is white in this app. Wrap caller-supplied icons in a View with CSS `color` (as Input's `Icon` and Dropdown's `ItemIcon` do), or pass `color` explicitly.
- **Theme tokens:** spacing, radius, border, and font size tokens are CSS strings that already include units. Use them directly.
- **Line heights:** theme typography presets resolve their ratios against their font-size tokens into `rem`. Native percentage line heights use the inherited font size, so `120%` can resolve against 16px even when the preset sets 32px. H1 uses `2.4rem` to keep its intended 38.4px line height on both platforms.
- **Localization:** user-facing strings in components and the app should go through i18n, with English keys in `apps/native/src/i18n/locales/en.json`. The test page is the one exception.
