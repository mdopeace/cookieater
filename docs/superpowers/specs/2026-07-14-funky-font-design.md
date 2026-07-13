# Funky Font Design

## Overview

Add a playful, retro font pairing to the Cookieater browser extension, replacing the system font stack.

## Font Pairing

| Usage | Font | Weight | Source |
|-------|------|--------|--------|
| Brand heading ("cookieater") | Fredoka | 700 (Bold) | `@fontsource/fredoka` |
| Body text (all UI labels, inputs, buttons, cookie data) | Nunito | 400/600 | `@fontsource/nunito` |

## Approach

Use `@fontsource` npm packages — fonts are self-hosted, bundled in the extension, require zero network requests, and work offline.

## Changes

### 1. Install packages

```sh
pnpm add @fontsource/fredoka @fontsource/nunito
```

### 2. `entrypoints/popup/style.css`

- Add font imports at the top:
  ```css
  @import "@fontsource/fredoka/700.css";
  @import "@fontsource/nunito/400.css";
  @import "@fontsource/nunito/600.css";
  ```
- Add font families to `@theme`:
  ```css
  --font-family-fredoka: "Fredoka", sans-serif;
  --font-family-nunito: "Nunito", sans-serif;
  ```
- Update `body` font-family to use Nunito.

### 3. `entrypoints/popup/App.tsx`

- Add `font-fredoka` class to the brand text span on line 111.

## Scope

No other component changes needed. The body font-family cascades to all elements. Tailwind's `font-fredoka` and `font-nunito` classes are available if ever needed elsewhere.
