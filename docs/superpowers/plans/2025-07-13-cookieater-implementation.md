# cookieater Implementation Plan

> **For agentic workers:** Execute tasks sequentially. Each task produces independently testable output.

**Goal:** Build a cross-browser Chrome extension for editing cookies with a card-based form UI, warm "Biscuit" theme, and reusable component library.

**Architecture:** WXT + React 19 + TypeScript popup extension. Cookies read/written via `chrome.cookies` API through WXT's unified `browser` wrapper. Single Save button commits all pending changes.

**Tech Stack:** WXT, React 19, TypeScript, Tailwind CSS, react-icons

## Global Constraints

- React 19 (not 18)
- Tailwind CSS with custom "Biscuit" theme (amber/orange primary, cream bg, teal accent)
- All UI interactions use react-icons (not emojis)
- Reusable UI components in `entrypoints/popup/components/ui/`
- Card-based form layout (not table)
- Single Save button (no autosave)
- Cross-browser via WXT (Chrome, Firefox, Edge)

---

### Task 1: Scaffold WXT Project + Install Dependencies

**Files:**
- Create: `package.json`
- Create: `wxt.config.ts`
- Create: `tsconfig.json`
- Create: `entrypoints/popup/index.html`
- Create: `entrypoints/popup/main.tsx`
- Create: `public/icon.svg`

**Interfaces:**
- Produces: Working WXT dev server that opens a browser with an empty popup

- [ ] **Step 1: Initialize WXT with React template**

```bash
cd /Users/mdrahman/mdopeace/cookieater
pnpm dlx wxt@latest init . --template react-ts --force
```

- [ ] **Step 2: Install additional deps**

```bash
pnpm add react-icons
pnpm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Write wxt.config.ts with permissions**

- [ ] **Step 4: Run dev server to verify it works**

```bash
pnpm dev
```

Wait for the browser to open, verify popup loads.

---

### Task 2: Configure Tailwind + Biscuit Theme

**Files:**
- Create: `entrypoints/popup/style.css`
- Modify: `wxt.config.ts` (add Tailwind plugin)
- Modify: `entrypoints/popup/main.tsx` (import CSS)

**Interfaces:**
- Produces: Global CSS with Tailwind directives and custom Biscuit theme variables

- [ ] **Step 1: Write style.css with Tailwind + custom theme**

```css
@import "tailwindcss";

@theme {
  --color-biscuit-50: #FFFBEB;
  --color-biscuit-100: #FEF3C7;
  --color-biscuit-200: #FDE68A;
  --color-biscuit-300: #FCD34D;
  --color-biscuit-400: #FBBF24;
  --color-biscuit-500: #D97706;
  --color-biscuit-600: #B45309;
  --color-biscuit-700: #92400E;
  --color-biscuit-800: #78350F;
  --color-biscuit-900: #451A03;
  --color-cream: #FFFBEB;
  --color-teal: #0D9488;
  --color-teal-light: #14B8A6;
  --color-coral: #EA580C;
}
```

- [ ] **Step 2: Update wxt.config.ts to load Tailwind**
- [ ] **Step 3: Import style.css in main.tsx**
- [ ] **Step 4: Run dev and verify styles load**

---

### Task 3: Reusable UI Components

**Files:**
- Create: `entrypoints/popup/components/ui/Button.tsx`
- Create: `entrypoints/popup/components/ui/Input.tsx`
- Create: `entrypoints/popup/components/ui/Select.tsx`
- Create: `entrypoints/popup/components/ui/Card.tsx`
- Create: `entrypoints/popup/components/ui/Modal.tsx`

**Interfaces:**
- Produces: Reusable component library used by all popup features
- Exports: `Button`, `Input`, `Select`, `Card`, `Modal`

Components defined with strict props (variant, icon, size, etc.). All use Tailwind Biscuit palette.

---

### Task 4: Types + Hooks

**Files:**
- Create: `entrypoints/popup/types.ts`
- Create: `entrypoints/popup/hooks/useCookies.ts`

**Interfaces:**
- `types.ts` exports: `CookieItem`, `PendingChange`
- `useCookies` exports: `{ cookies, loading, error, addCookie, updateCookie, removeCookie, save, discard, hasChanges, pendingChanges }`

- [ ] **Step 1: Define CookieItem type matching chrome.cookies.Cookie shape**
- [ ] **Step 2: Implement useCookies hook with local pending changes tracking**
- [ ] **Step 3: Implement save() that batches all cookies.set/cookies.remove calls**

---

### Task 5: Popup Components

**Files:**
- Create: `entrypoints/popup/components/DomainBar.tsx`
- Create: `entrypoints/popup/components/SearchBar.tsx`
- Create: `entrypoints/popup/components/CookieCard.tsx`
- Create: `entrypoints/popup/components/AdvancedFields.tsx`
- Create: `entrypoints/popup/components/ActionBar.tsx`

**Interfaces:**
- `DomainBar`: Shows current domain, auto-detects from active tab, manual override
- `SearchBar`: Real-time search filter, calls parent callback
- `CookieCard`: Displays a single cookie as a card with simple/advanced toggle, delete trigger
- `AdvancedFields`: Expanded view with Domain, Path, Expires, Secure, HttpOnly, SameSite, HostOnly, Session
- `ActionBar`: Add Cookie, Export, Import, Clear All buttons

---

### Task 6: App Integration

**Files:**
- Modify: `entrypoints/popup/App.tsx`

Wires all components together. Manages state: domain, search query, cookies list, pending changes.

---

### Task 7: Browser Testing

- [ ] **Step 1: Run `pnpm dev`**
- [ ] **Step 2: Open a site, open extension popup, verify domain auto-detection**
- [ ] **Step 3: Edit a cookie value, verify pending state shows**
- [ ] **Step 4: Click Save, verify cookie is updated (refresh page to confirm)**
- [ ] **Step 5: Test Add, Delete, Clear All, Export, Import**
- [ ] **Step 6: Toggle Advanced, verify all fields render correctly**
- [ ] **Step 7: Test search/filter**
