# Funky Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Fredoka + Nunito font pairing to Cookieater, replacing the system font stack.

**Architecture:** Self-hosted fonts via `@fontsource` npm packages — zero network requests, works offline. Fonts are imported in `style.css` and registered as Tailwind theme values.

**Tech Stack:** `@fontsource/fredoka`, `@fontsource/nunito`, Tailwind CSS v4 `@theme`, WXT/Vite

## Global Constraints

- Fonts must be self-hosted (no CDN/network requests)
- Fredoka 700 for brand heading only
- Nunito 400/600 for all body text
- Must work offline in the extension popup

---

### Task 1: Install font packages and configure styles

**Files:**
- Modify: `entrypoints/popup/style.css`

**Interfaces:**
- Consumes: nothing
- Produces: `font-fredoka` and `font-nunito` Tailwind utility classes available project-wide

- [ ] **Step 1: Install @fontsource packages**

```bash
pnpm add @fontsource/fredoka @fontsource/nunito
```

- [ ] **Step 2: Add font imports and theme config to style.css**

Replace the content of `entrypoints/popup/style.css` with:

```css
@import "tailwindcss";
@import "@fontsource/fredoka/700.css";
@import "@fontsource/nunito/400.css";
@import "@fontsource/nunito/600.css";

@theme {
  --font-family-fredoka: "Fredoka", sans-serif;
  --font-family-nunito: "Nunito", sans-serif;
  --color-biscuit-50: #fffbeb;
  --color-biscuit-100: #fef3c7;
  --color-biscuit-200: #fde68a;
  --color-biscuit-300: #fcd34d;
  --color-biscuit-400: #fbbf24;
  --color-biscuit-500: #d97706;
  --color-biscuit-600: #b45309;
  --color-biscuit-700: #92400e;
  --color-biscuit-800: #78350f;
  --color-biscuit-900: #451a03;
  --color-cream: #fffbeb;
  --color-teal: #0d9488;
  --color-teal-light: #14b8a6;
  --color-coral: #ea580c;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

body {
  margin: 0;
  font-family: var(--font-family-nunito);
  background-color: var(--color-cream);
  color: #1f2937;
  width: 480px;
  min-height: 400px;
}
```

- [ ] **Step 3: Apply Fredoka to the brand heading in App.tsx**

In `entrypoints/popup/App.tsx`, line 111, change:
```tsx
<span className="font-bold text-lg">cookieater</span>
```
to:
```tsx
<span className="font-fredoka font-bold text-lg">cookieater</span>
```

- [ ] **Step 4: Verify build**

```bash
pnpm compile
```

Expected: No errors, fonts bundled into output.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Fredoka + Nunito fonts via @fontsource"
```
