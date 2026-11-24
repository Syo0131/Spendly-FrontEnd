# Spendly Design System (DESIGN.md)

This document specifies the visual identity, tokens, typography, layout rhythm, motion guidelines, iconography, and data-visualization rules for **Spendly**.

---

## 1. Direction & Brand Personality

- **Archetype:** **Swiss Ledger / Modern Editorial** with **Electric Lime (Neo-Fintech)** energy.
- **Inspiration:** Financial Times, Linear, Wise, Cash App.
- **Design Intent:**
  - Move away from generic corporate SaaS blues.
  - Present financial data with ledger-grade precision, hairline borders, and strict tabular alignment.
  - Pair deep pine / obsidian dark tones with an electrizing high-contrast lime chartreuse accent that communicates liquidity, momentum, and authority.
  - Keep light mode as clean, high-contrast, tactile financial bond paper.

---

## 2. Design Tokens

All semantic color tokens are defined as space-separated **RGB triplets** (`R G B`) inside CSS variables. This ensures complete compatibility with Tailwind CSS alpha-transparency utilities (e.g. `bg-surface/50`, `text-ink/80`, `border-border/40`).

### 2.1 Color Tokens Table

| Token Name | Light Mode (Bond Paper) | Dark Mode (Deep Pine / Obsidian) | Purpose & Usage |
|---|---|---|---|
| `--color-surface-canvas` | `250 250 249` (`#fafaf9`) | `6 11 9` (`#060b09`) | Application viewport background |
| `--color-surface` | `255 255 255` (`#ffffff`) | `12 21 17` (`#0c1511`) | Standard card and container surface |
| `--color-surface-raised` | `245 245 244` (`#f5f5f4`) | `18 31 25` (`#121f19`) | Popovers, dropdown menus, modals, headers |
| `--color-surface-sunken` | `238 238 236` (`#eeeeec`) | `4 8 6` (`#040806`) | Inset wells, input backgrounds, search fields |
| `--color-border` | `226 232 240` (`#e2e8f0`) | `26 44 36` (`#1a2c24`) | Structural hairline dividers, card borders |
| `--color-border-subtle` | `241 245 249` (`#f1f5f9`) | `18 31 25` (`#121f19`) | Internal row borders, dividers |
| `--color-ink` | `15 23 42` (`#0f172a`) | `245 245 244` (`#f5f5f4`) | High-contrast primary text, headers, totals |
| `--color-ink-muted` | `100 116 139` (`#64748b`) | `140 155 176` (`#8c9bb0`) | Secondary labels, descriptions, timestamps |
| `--color-ink-subtle` | `148 163 184` (`#94a3b8`) | `90 105 125` (`#5a697d`) | Placeholders, disabled text, icons |
| `--color-accent` | `101 163 13` (`#65a30d`) | `163 230 53` (`#a3e635`) | Brand signature: Electric Lime / Chartreuse |
| `--color-accent-contrast` | `255 255 255` (`#ffffff`) | `6 11 9` (`#060b09`) | Text and icon color on top of `--color-accent` |
| `--color-income` | `5 150 105` (`#059669`) | `16 185 129` (`#10b981`) | Inflow cash, credit, positive balances |
| `--color-expense` | `225 29 72` (`#e11d48`) | `244 63 94` (`#f43f5e`) | Outflow cash, debit, spending |
| `--color-status-ok` | `5 150 105` (`#059669`) | `16 185 129` (`#10b981`) | Budget status `< 75%` |
| `--color-status-warning` | `217 119 6` (`#d97706`) | `245 158 11` (`#f59e0b`) | Budget status `≥ 75%` and `< 90%` |
| `--color-status-critical` | `220 38 38` (`#dc2626`) | `225 29 72` (`#e11d48`) | Budget status `≥ 90%` or overspent (`> 100%`) |
| `--color-track` | `226 232 240` (`#e2e8f0`) | `26 44 36` (`#1a2c24`) | Background track for progress bars |
| `--color-bar-neutral` | `148 163 184` (`#94a3b8`) | `100 116 139` (`#64748b`) | Unbudgeted category bar color |
| `--color-focus-ring` | `101 163 13` (`#65a30d`) | `163 230 53` (`#a3e635`) | High-visibility accessible outline for focus-visible |

### 2.2 Tailwind Integration Pattern

In `tailwind.config.js`:

```javascript
function withAlpha(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: withAlpha('--color-surface-canvas'),
        surface: {
          DEFAULT: withAlpha('--color-surface'),
          raised: withAlpha('--color-surface-raised'),
          sunken: withAlpha('--color-surface-sunken'),
        },
        border: {
          DEFAULT: withAlpha('--color-border'),
          subtle: withAlpha('--color-border-subtle'),
        },
        ink: {
          DEFAULT: withAlpha('--color-ink'),
          muted: withAlpha('--color-ink-muted'),
          subtle: withAlpha('--color-ink-subtle'),
        },
        accent: {
          DEFAULT: withAlpha('--color-accent'),
          contrast: withAlpha('--color-accent-contrast'),
        },
        income: withAlpha('--color-income'),
        expense: withAlpha('--color-expense'),
        status: {
          ok: withAlpha('--color-status-ok'),
          warning: withAlpha('--color-status-warning'),
          critical: withAlpha('--color-status-critical'),
        },
        track: withAlpha('--color-track'),
        'bar-neutral': withAlpha('--color-bar-neutral'),
        'focus-ring': withAlpha('--color-focus-ring'),
      }
    }
  }
};
```

---

## 3. Typography

All typography is self-hosted via npm packages to ensure **100% offline functionality** in PWA / Capacitor builds.

### 3.1 Font Packages

1. **Primary Interface Font:** `@fontsource-variable/plus-jakarta-sans`
   - Clean, geometric grotesque with warm humanist terminals and high optical legibility.
   - CSS Stack: `'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
2. **Numeric & Monospace Font:** `@fontsource-variable/jetbrains-mono`
   - High-precision monospace font used for all currency figures (`RD$`), percentage badges, and budget thresholds.
   - All financial numbers MUST use `font-mono tabular-nums`.
   - CSS Stack: `'JetBrains Mono Variable', 'JetBrains Mono', monospace`

### 3.2 Type Scale

| Scale Name | Size | Line Height | Weight | Tracking | Primary Usage |
|---|---|---|---|---|---|
| `display-2xl` | 32px (`2rem`) | 40px (`2.5rem`) | 800 (`extrabold`) | `-0.025em` | Desktop hero balance, net worth summaries |
| `display-xl` | 24px (`1.5rem`) | 32px (`2rem`) | 700 (`bold`) | `-0.02em` | Mobile hero balance, page titles |
| `title-lg` | 20px (`1.25rem`) | 28px (`1.75rem`) | 700 (`bold`) | `-0.015em` | Modal headers, card section titles |
| `title-md` | 16px (`1rem`) | 24px (`1.5rem`) | 600 (`semibold`) | `-0.01em` | Category names, table headers, form group titles |
| `body-md` | 14px (`0.875rem`) | 20px (`1.25rem`) | 400 (`normal`) / 500 (`medium`) | `0` | Standard body copy, form inputs, list items |
| `body-sm` | 12px (`0.75rem`) | 16px (`1rem`) | 500 (`medium`) | `0` | Secondary metadata, budget helper descriptions |
| `caption-mono`| 11px (`0.6875rem`) | 14px (`0.875rem`) | 600 (`semibold`) | `+0.02em` | `[OK 61%]`, `[WARN 83%]`, date pills, hotkey hints |

---

## 4. Radii, Elevation & Spacing

### 4.1 Border Radius Scale

In accordance with the **Swiss Ledger** philosophy, corners are crisp, deliberate, and structural (not bubbly):

- `rounded-none`: 0px (charts, segmented control borders, progress indicators)
- `rounded-sm`: 2px (micro tags, inner progress bar fills)
- `rounded-md`: 6px (inputs, buttons, select menus)
- `rounded-lg`: 8px (table rows, toast cards, small dialogs)
- `rounded-xl`: 12px (dashboard cards, KPI containers, bottom sheets)
- `rounded-2xl`: 16px (desktop dialog modals)
- `rounded-full`: 9999px (month selector pill, user avatar, status dots)

### 4.2 Elevation & Borders

- **Primary Structure:** Swiss Ledger relies on **1px hairline borders** (`border border-border`) rather than deep dramatic shadows.
- **Card Shadow:**
  - Light mode: `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`)
  - Dark mode: `none` (dark surfaces distinguish hierarchy through `--color-surface` vs `--color-surface-raised` and hairline borders).
- **Dialog Modal Shadow:** `shadow-2xl` (`0 25px 50px -12px rgb(0 0 0 / 0.25)`).

### 4.3 Spacing Rhythm

Strict 4px geometric grid:
- `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-5` (20px), `p-6` (24px), `p-8` (32px), `p-12` (48px).
- Desktop page gutter: `px-6 py-6` to `px-8 py-8`.
- Mobile screen gutter: `px-4 py-4`.

---

## 5. Motion & Interaction Guidelines

Following Emil Kowalski's design-engineering philosophy (`emil-design-eng`):

### 5.1 Absolute Rules

1. **Never use `transition: all`.** Always declare explicit transition properties (e.g. `transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-out`).
2. **Never animate keyboard-initiated actions.** Opening command palettes or keyboard navigation must respond in 0ms to feel native and instant.
3. **No element appears from `scale(0)`.** Popovers and modals enter from `scale(0.96); opacity: 0` to `scale(1); opacity: 1`.

### 5.2 Transition Presets

| Interaction | Properties | Duration | Curve / Easing |
|---|---|---|---|
| **Hover on clickable row/button** | `background-color`, `border-color`, `color` | 100ms | `ease-out` |
| **Active button tap** | `transform: scale(0.98)` | 75ms | `ease-out` |
| **Dropdown / Popover enter** | `transform`, `opacity` | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Dialog / Modal enter** | `transform`, `opacity` | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Modal backdrop fade** | `opacity` | 200ms | `ease-out` |
| **Toast notification enter** | `transform`, `opacity` | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Progress bar width change** | `width` | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` |

---

## 6. Iconography

### 6.1 Package & System

- Self-hosted package: `@fontsource/material-icons-outlined`
- In Angular: rendered via `<ui-icon [name]="iconName" [size]="'sm'|'md'|'lg'" [label]="ariaLabel" />`
- Default fallback icon for missing or unmapped categories: `'category'`.

### 6.2 Icon Sizing Scale

- `'sm'`: 16px (`text-base` / `w-4 h-4`) — micro indicators, table actions, button icons.
- `'md'`: 20px (`text-xl` / `w-5 h-5`) — standard navigation links, form field icons.
- `'lg'`: 24px (`text-2xl` / `w-6 h-6`) — empty state graphics, feature hero indicators.

### 6.3 Codebase Icon Registry

The following Material Icons Outlined identifiers are verified in the codebase and must be supported:

```text
account_balance, add, add_circle, apps, arrow_circle_down, arrow_circle_up, 
arrow_upward, calendar_today, campaign, category, check, chevron_left, 
chevron_right, close, construction, dark_mode, dashboard, delete, delete_forever, 
delete_outline, download, edit, error, expand_more, flag, history, link_off, 
logout, menu, notifications, pie_chart, replay, savings, settings, system_update, 
translate, trending_down, trending_up, warning, restaurant, home, directions_car, 
shopping_cart, shopping_bag, medical_services, school, bolt, sports_esports
```

---

## 7. Data Visualization Rules

### 7.1 Category Spending List (§5.1)

The category list replaces the previous doughnut chart on the dashboard:

1. **Filtering:** Only categories with spending `> 0` in the selected month are rendered (matching `getExpensesByCategory`). Budgeted categories with RD$ 0 spent are omitted.
2. **Sort Order:** Sorted strictly by monthly amount spent, descending.
3. **Primary Metric:** RD$ spent this month (`tabular-nums`).
4. **Monthly Budget Rows:**
   - Bar width represents: `spent / limit`.
   - Clamping: If `spent > limit` (overspent, e.g. 130%), the visual bar is clamped to `100%`, while displaying the true percentage (e.g. `130%`) with `status-critical`.
   - Secondary text: `"de RD$ X mensual"`.
   - Thresholds:
     - `status-ok` (`#10b981`): spent `< 75%`.
     - `status-warning` (`#f59e0b`): spent `≥ 75%` and `< 90%`.
     - `status-critical` (`#e11d48`): spent `≥ 90%` or `spent > limit`.
5. **Yearly Budget Rows:**
   - Bar represents year-to-date spent vs yearly limit: `spent_ytd / limit_yearly`.
   - Secondary text explicitly states: `"RD$ X de RD$ Y este año"`.
6. **Unbudgeted Rows:**
   - Display a neutral, hairline progress bar (1.5px height) using `--color-bar-neutral` over `--color-track`.
   - Secondary text states: `"N% del total"`.
   - Never display alarm or warning colors on unbudgeted categories.
7. **Interactivity:** Tapping any category row navigates to `/expenses` filtered by that category and month.
8. **Empty State:** If the user has zero configured budgets across the entire app, one discreet link at the bottom of the list directs them to `/budgets`.

### 7.2 12-Month Cashflow Chart

- Chart bars use semantic tokens:
  - Income bars: `rgb(var(--color-income))`
  - Expense bars: `rgb(var(--color-expense))`
- Grid lines, tick labels, and tooltip styling are read dynamically through the `readToken()` helper:
  - Grid: `rgb(var(--color-border) / 0.5)`
  - Ticks: `rgb(var(--color-ink-muted))`
- Guarantees full legibility when toggling between light and dark themes without page reloads.

---

## 8. Navigation Architecture

### 8.1 Mobile Bottom Navigation (5 Destinations)

Fixed to the bottom of the mobile viewport (`h-16`, safe-area inset aware via `pb-safe`):

1. **Inicio** (`/dashboard`): `dashboard` icon.
2. **Gastos** (`/expenses`): `trending_down` icon.
3. **Ingresos** (`/incomes`): `trending_up` icon.
4. **Límites** (`/budgets`): `pie_chart` icon.
5. **Más** (Bottom Sheet Trigger): `more_horiz` icon.

#### Content of the "Más" Drawer Sheet:
- **Metas** (`/goals`): `flag` icon.
- **Recurrentes** (`/recurring`): `replay` icon.
- **Recordatorios** (`/reminders`): `notifications` icon.
- **Bancos** (`/banks`): `account_balance` icon, featuring a **`✨ Premium`** badge in Electric Lime.
  - *Monetization Flow:* In the Banks screen, un-activated users see a high-conversion Call to Action button: **"Activar Premium vía WhatsApp"**, opening WhatsApp with a prefilled message for manual manual verification and activation.
- **Ajustes** (`/settings`): `settings` icon (theme toggle, language switch, profile, security).

### 8.2 Desktop Sidebar

Fixed on the left viewport (`w-64`, full height):
- Top: Spendly brand mark with Electric Lime signature badge.
- Navigation links: Clean list with 8px vertical rhythm. Active item styled with subtle lime surface tint (`bg-accent/10 text-accent font-semibold`).
- Bottom: User identity chip (name, current language/currency) + Settings shortcut button.

---

## 9. Accessibility Baseline

- **Scale allowed:** `user-scalable=no` removed; viewport zooming preserved.
- **Focus visible:** Every interactive component uses `focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface`.
- **Labels:** Every icon-only button requires an `aria-label`. Every form input `<label for="id">` strictly matches its input `id`.
- **Semantics:** Zero clickable `<div>` elements; only semantic `<button>` and `<a>` elements with proper keyboard focus and `Enter`/`Space` handlers.
- **Color Contrast:** All text tokens meet WCAG 2.1 AA (minimum 4.5:1 for body copy and 3:1 for large display titles).
