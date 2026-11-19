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
- `checkbox.tsx`
- `phone-input.tsx`
- `radio.tsx` and `radio-group.tsx`
- `overflow-fade`,
- `button`,
- `pagination`,
- `modal.tsx`, including the context lifecycle, fixed title/buttons, and synchronized web backdrop blur/dimming

Still using the web version (`styled-components` and DOM elements):
`dropdown` and `select`

### Modal and loader handoff

The user confirmed the final behavior works as expected. Modal conversion and full-page loader encapsulation are complete; continue with select and dropdown.

- `modal.tsx`: React Native Modal with a centered desktop-web dialog and a bottom drawer below `theme.breakpointNumbers.sm` (768px) or on any native screen. Keeps scrollable content, keyboard avoidance, safe-area padding, close/backdrop/Escape/Android Back handling, and enter/exit animations.
- No variant prop or full-screen mobile option. Modal does not render a form or accept `onSubmit`; place forms inside the body when needed.
- Put `ModalTitle` and `ModalButtons` directly inside `Modal`: they stay outside the scrolling body and are always visible. Other children scroll between them.
- Animations use the app's existing Reanimated/Worklets libraries. Raw animated layers keep animated styles outside styled-components. Native animation waits until shown/measured and translates by the drawer's height.
- The user confirmed the Reanimated animation is smooth on native. On web, backdrop blur and tint share the same animated opacity layer; putting blur inside a fading parent isolates its backdrop and delays blur until opacity reaches 1.
- Prefer `useModal().openModal(<Modal>...</Modal>)` and `useModal().closeModal()` from anywhere under the shared provider. `apps/native/src/app/_layout.tsx` now installs `ModalProvider` at app scope. The older `UiProvider` remains for existing native dialogs; it is a separate API.
- The provider owns open/closing state, not animation timing. Modal calls `completeClose` after the exit animation finishes. Replacements are keyed and completion callbacks are scoped to the modal instance, so an old animation cannot dismiss a replacement.
- `closeOverride` remains for existing locally controlled callers such as Select. Set an accessible dialog name and pass a translated `closeLabel`, e.g. `t('common.actions.close')`. The legacy English close label remains the default.
- Direct imports: `@repo/shared/components/modal` and `@repo/shared/context/modal-provider`. Native callers need `SafeAreaProvider` (already present in the app root).
- The test page keeps context-opened standard, long-content, backdrop-disabled, and replacement-while-closing examples inline in `IndexPage`. Stateful dialog content should own its own state instead of capturing changing page state in the node passed to `openModal`.
- `Loader fullPage` encapsulates its own React Native Modal on web and native. Render it conditionally without an external modal. Optional `onRequestClose` handles Escape/Android Back; without it the loader blocks dismissal until unmounted.
- Shared/native typechecks, targeted ESLint/Prettier, and Android/iOS bundle exports pass. Browser checks cover context opening/closing, replacement during closing, fixed title/footer positions, dismissal, absence of an implicit form, and backdrop blur during intermediate animation frames (including a rendered-pixel contrast check). Earlier checks also covered full-page loader coverage/scroll restoration. Final behavior was accepted by the user after these refinements.

Next: select and dropdown.

- Both must reuse this Modal on mobile web and native.
- Select has an input-like trigger; dropdown accepts any trigger. Keep their menu behavior aligned; share implementation only where it is simpler than separate components.
- `select.tsx` already uses `Input`, `InputIconButton`, and a locally controlled Modal on mobile web.

## Workflow for each component

1. Rewrite the component as a single file using React Native primitives, styled with `styled-components/native`.
2. Add an export for it in `apps/shared/package.json` if it doesn't have one. These exports point to `dist`.
3. Rebuild shared, because native uses `dist`:
   - `pnpm.cmd --filter @repo/shared exec tsc -p tsconfig.json --emitDeclarationOnly --incremental false`
   - `pnpm.cmd --filter @repo/shared exec swc src -d dist --strip-leading-paths --copy-files`
4. Add examples to the test page `apps/native/src/app/(tabs)/index.tsx`, including normal, error, and disabled states where they apply.
   - **The test page must not use translations.** A comment at the top of the file says so.
   - The page uses a white background.
5. Check the change:
   - `pnpm.cmd --filter @repo/shared typecheck`
   - `pnpm.cmd --filter @repo/native typecheck`
   - Run `eslint` and `prettier` on the files you changed.
   - Check web with `pnpm.cmd --filter @repo/native exec expo start --web --port 8099`.
   - Check that the native bundle builds with `pnpm.cmd --filter @repo/native exec expo export --platform android --platform ios`.
   - The user then tests on a real device.

Use `pnpm.cmd` in Windows PowerShell.

## Lessons learned

These are gotchas found while converting components:

- **Focus and active states on native:** pseudo-selectors alone were not reliable on a device. `Input` tracks `isFocused` and `isPressed` in state and passes `$isActive` to the styles, only when the platform isn't web. On web, CSS `:focus` and `:hover` still apply.
- **Vertically centering absolute children:** don't use `top: Npx` with `translateY(-50%)`. Native doesn't center reliably that way. Put the children inside a container with `position: relative; justify-content: center`, leave out `top` and `bottom`, and set only `left` or `right`. `InputField` in `input.tsx` does this.
- **Complex selectors:** selectors like `& > svg` and `*` are ignored on native, with a dev warning. They're fine to keep as web-only styling. Pass colors to icons as props instead.
- **Disabled inputs on web:** react-native-web only turns `editable={false}` into `readOnly`. Also pass `disabled` on web only: `...(Platform.OS === 'web' ? { disabled } : {})`.
- **Textarea resizing on web:** react-native-web's multiline `TextInput` defaults to `resize: none`. Set `resize: vertical` explicitly.
- **Taps on web:** react-native-web's `TextInput` doesn't fire `onPress`. Wrap it in `<Pressable accessible={false}>`.
- **Icons:** export all icons from `apps/shared/src/assets/icons.ts`, using their original Lucide names and no `as` aliases. Native components need `lucide-react-native`. Don't pass `accessible={false}` to an SVG icon, because it causes a DOM warning on web. `aria-hidden` is fine.
- **Accessibility props:** use `role`, `aria-*`, and `accessibilityLabel`/`accessibilityState`. react-native-web maps them to the DOM.
- **Modal backdrop hit testing:** use a plain React Native `View` with `pointerEvents="box-none"` for the positioning layer. The styled View dropped that prop on web, blocking backdrop presses.
- **Theme tokens:** spacing, radius, border, and font size tokens are CSS strings that already include units. Use them directly.
- **Line heights:** theme typography presets resolve their ratios against their font-size tokens into `rem`. Native percentage line heights use the inherited font size, so `120%` can resolve against 16px even when the preset sets 32px. H1 uses `2.4rem` to keep its intended 38.4px line height on both platforms.
- **Localization:** user-facing strings in components and the app should go through i18n, with English keys in `apps/native/src/i18n/locales/en.json`. The test page is the one exception.
