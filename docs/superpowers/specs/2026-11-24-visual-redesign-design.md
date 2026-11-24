# Spendly Visual Redesign — Design

- **Date:** 2026-11-24
- **Branch:** `redesign/visual-identity`, branched from `master`. `master` keeps the current design alive until the redesign is merged.
- **Status:** draft, pending user approval.

## 1. Intent

Today Spendly looks like any generic SaaS app: cyan primary, Inter, rounded cards and a grey sidebar. Nothing in it says "this is where you manage your money".

The redesign has two goals:

1. Give Spendly a **distinctive visual identity that reads as a finance app**.
2. Make the app **instantly understandable**: someone opening the dashboard should know within seconds how much they spent and where it went, without interpreting charts.

## 2. Goals, non-goals, anti-goals

### Goals

- A unique visual identity, expressed as semantic design tokens and documented in `DESIGN.md`.
- A dashboard built around a per-category spending list (see §5.1) instead of the doughnut chart.
- A shared, reusable component layer, so the identity lives in one place instead of ~17 copied modals and ~12 button variants.
- Accessibility baseline:
  - visible focus;
  - keyboard-operable overlays and pickers;
  - labelled controls;
  - zoom allowed;
  - actions reachable without hover.
- Offline-correct assets for PWA/Capacitor: fonts and icons are bundled, not loaded from the Google CDN.
- A clean `.gitignore` for agent/tooling folders.

### Non-goals

- Functional bug fixes. They live in a separate plan: `2026-11-24-bugfix-design.md`.
- Backend/API changes.
- New product features such as new screens or new data.
- Tailwind 3 → 4 migration. It can be considered later and is not required for this work.

### Anti-goals

The redesign fails, even if it "works", when any of these happens:

- It ends up looking like a themed component library (Material, PrimeNG) or a generic dashboard template.
- Existing behavior is silently lost. The full list is in §7.
- The new look is applied by restyling each screen in place, leaving duplicated markup behind.

## 3. Constraints

- **Stack:**
  - Angular 21: standalone, zoneless, signals, inline templates.
  - Tailwind 3.4 with `darkMode: 'class'`.
  - Capacitor 8 (Android/iOS) and PWA with a service worker.
  - Chart.js through ng2-charts.
- **Themes:** dark theme is the default (`ThemeService`). Light theme must stay fully supported.
- **i18n:** EN/ES through `TranslationService`. Every new UI string goes through it.
- **Currency:** DOP (RD$).
- **Data from the API:**
  - Category **icons** are Material Icons ligature names (`Category.icons`).
  - Category **colors** are arbitrary hex values (`Category.color`).
  - Consequence: the identity must look right with arbitrary category colors, and any icon-set change needs a name → icon mapping with a fallback.
- **Dashboard data:**
  - `getExpensesByCategory` returns `MonthlyStats` keyed by **category name**, not id.
  - Budgets (`Budget.categoryId`, `category.name`, `limit`, `spent`, `warningThreshold`) must be joined by category name.
- **Testing:** there are no UI tests. The only spec is `app.spec.ts`. Visual verification is done in a real browser with Playwright at mobile and desktop widths, in light and dark.
- **Verification environment** (user decision, 2026-11-24): production backend (`https://backend.daybeldiaz.dev/api`), using the user's **personal** account.
  - Credentials are never written to files, docs, commits or memory. They are supplied at run time only.
  - Test data rules, because this is real personal data:
    - Every record created during verification is prefixed with `[TEST]`.
    - It is deleted in the same session, and the cleanup is checked before the session ends.
    - Existing records are never edited or deleted.
    - Categories are global and read-only: the API only exposes `GET /api/categories`. Budget-threshold checks therefore use a category that has no budget in the test month, with a temporary budget and `[TEST]` expenses, and both are deleted afterwards.
    - The backend recalculates the budget's `spent` when an expense is deleted. After cleanup, confirm the real budgets of that month show the same `spent` as before the test.

## 4. Approaches

The base is the same for every approach: semantic Tailwind tokens and shared components organized by **atomic design** (atoms → molecules → organisms), using the **container/presentational** pattern. The approaches differ in what the component *behavior* is built on.

| Approach | Trade-off | Decision |
|---|---|---|
| **1. Own design system on top of Angular CDK** | CDK provides unstyled behavior: `Dialog` (focus trap, Esc, scroll lock, stacking), `Overlay` (positioned dropdowns), `A11y` (focus management, `cdkTrapFocus`, live announcer) and `Listbox` (keyboard pickers). We own 100% of the look. Costs one dependency (`@angular/cdk`) and its learning curve. | **Chosen by the user.** |
| 2. Fully hand-rolled system | No dependency, full control. We would have to re-implement focus trap, overlay positioning, scroll lock and arrow-key navigation, which is exactly the area that is broken today. | Rejected. |
| 3. Component library with a theme (Material / PrimeNG) | Fastest route, but it brings back the generic look this redesign exists to remove. | Discarded (anti-goal). |

## 5. Decided parts

### 5.1 Dashboard: per-category spending list

The list replaces the doughnut chart.

```
November expenses                      RD$ 142,300

🍔 Food                RD$ 45,200   of RD$ 50,000
   ██████████████████████████░░░  90%  ⚠
🏠 Home                RD$ 38,000   of RD$ 60,000
   ██████████████████░░░░░░░░░░░  63%
🚗 Transport           RD$ 18,900   13% of total
   ▬▬▬▬
```

- **Which categories appear** (user decision, 2026-11-24): only categories with spending greater than 0 in the selected month, which is exactly what `getExpensesByCategory` returns. Budgeted categories with nothing spent yet are not listed.
- **Order:** categories are sorted by amount spent, descending.
- **Row with a budget:**
  - The bar shows `spent / limit`.
  - The status color is ok / warning / critical. Warning starts at `warningThreshold`, with default 75 as today. Critical starts at the critical threshold (default 90). Over 100% is also critical.
  - The secondary text reads "of RD$ X".
- **Row without a budget:**
  - The bar is thin and neutral, and shows the category's share of the month total.
  - It has no alert colors.
  - The secondary text reads "N% of total".
- The secondary text is what tells the two bar meanings apart, so the user never has to guess which one they are looking at.
- **Tapping a row** opens Expenses filtered by that category and month.
- **The dashboard only reads budgets; it never manages them.**
  - There are no "assign budget" actions on rows.
  - If the user has no budgets at all, one discreet line at the end of the list links to the Budgets section.
- The status logic currently lives in `BudgetsComponent.getProgressColor`, where it returns Tailwind class strings. It moves to a pure function that returns a status value (`'ok' | 'warning' | 'critical'`). Dashboard and Budgets both use that function, and the presentational component maps the status to tokens.
- **Budget periods:**
  - Budgets are limited to `MONTHLY` and `YEARLY` (user decision, 2026-11-24). The change itself is in the functional plan (`2026-11-24-bugfix-design.md`, C1).
  - The bar always uses the budget's own `spent` from the API. The backend's `BudgetSpentService` already calculates it per period, so the frontend must stop replacing it with the month's category total (bugfix B9).
  - My call, can be overridden:
    - The row's main amount is always what was spent **this month**.
    - If the category has a `MONTHLY` budget for the selected month, the bar shows that budget, as described above.
    - If it only has a `YEARLY` budget, the bar shows year-to-date `spent / limit` and the secondary text says so explicitly: "RD$ 120,000 of RD$ 500,000 this year".
    - If several budgets match the same period, the dashboard uses the most recent `startDate`.
    - Legacy `DAILY` or `WEEKLY` budgets are shown as a no-budget row.
- The balance/income/expense summary and the 12-month income vs. expense chart stay. Their visual treatment is defined in Phase 1.

### 5.2 Architecture rules (SOLID, applied to Angular)

- **Single responsibility:**
  - Container (page) components own state, services and routing.
  - Presentational components only take `input()`, emit `output()`, use `ChangeDetectionStrategy.OnPush`, and inject no data services.
  - Pure logic (budget status, category join, month helpers, currency formatting) lives in `core/utils` as plain functions, with unit tests.
- **Open/closed:** a component extends through inputs and content projection (variants such as `variant`, `size`, `tone`), never by copying markup.
- **Liskov substitution / interface segregation:** components take small, specific inputs instead of whole API models where possible. For example, a list row takes `label`, `amount` and `status` rather than an `Expense`.
- **Dependency inversion:**
  - Presentational components depend on nothing app-specific.
  - Features depend on the shared UI layer; the shared UI layer never depends on features.
- **Folder layout (proposal):**

  ```
  src/app/shared/ui/
    tokens/        (TS mirrors of tokens if needed, e.g. chart colors)
    atoms/         button, icon, badge, amount, progress-bar, spinner, skeleton, toggle, field-label
    molecules/     form-field, currency-input, category-badge, month-selector, segmented-control, empty-state, list-row
    organisms/     dialog-shell (CDK Dialog), confirm-dialog, action-sheet, category-picker (CDK Listbox+Overlay), page-header, pagination
  ```

- **Tokens:**
  - Semantic names in `tailwind.config.js`: `surface`, `surface-raised`, `ink`, `ink-muted`, `income`, `expense`, `status-ok`, `status-warning`, `status-critical`, `accent`, and so on. They are backed by CSS variables, so light and dark themes switch in one place.
  - Raw palette classes (`bg-rose-500`, `text-teal-400`) and hex values are not used in feature code.
- **Charts:** chart colors are read from the same tokens through CSS variables, so they follow the theme. Today the grid and axis colors are fixed for dark mode.

### 5.3 Navigation

- **Mobile bottom navigation:**
  - Remove Banks, which is premium-locked and "coming soon", from the bottom bar.
  - Promote the most-used destinations.
  - The exact set is decided in Phase 1 together with the identity.
- **Desktop sidebar:** stays. Its active states use a single token instead of the current per-link colors (teal / rose / primary).
- **Toasts:** they must not overlap the mobile bottom navigation.

### 5.4 Accessibility baseline

- Remove `user-scalable=no` and `maximum-scale=1` from `index.html`.
- Use `focus-visible` styles on every interactive element.
- Every icon-only button has an `aria-label`.
- Every `<label for>` is paired with an input `id`.
- No clickable `<div>`: use a `<button>` or a link instead.
- Table row actions are visible without hover, or are reachable through a row menu.
- Dialogs use CDK focus trap and close consistently (Esc, plus backdrop where safe).

### 5.5 Assets

- Self-host the chosen font(s) and icons in the bundle. Today Inter and Material Icons load from `fonts.googleapis.com`, which breaks offline in Capacitor/PWA.
- Icons go through a single `ui-icon` component. If the icon set changes in Phase 1, that component maps the Material ligature names stored in `Category.icons` to the new set and falls back to a default icon.

### 5.6 `.gitignore`

My call; the user can override it.

- **Ignore** these local agent/tooling folders:
  - `.agent/`, `.agents/`
  - `.claude/`, which includes the machine-specific `settings.local.json`
  - `.atl/`
  - `.impeccable/`
  - `.codegraph/`
- **Commit** `skills-lock.json`. It pins skill sources and hashes, the same way a lockfile does, so collaborators can reinstall the same skills.
- **Narrow `*.txt`** to the files it was meant for, so a future `public/robots.txt` is not ignored. The builder confirms what `*.txt` was meant to cover before narrowing it.
- **Remove from the index** any of these paths that are already tracked (`git rm --cached`), without deleting them from disk.

## 6. Phases

Each phase is one or more reviewable commits of about 400 changed lines. Every phase ends with a browser check at 375px and 1280px, in both light and dark themes.

0. **Housekeeping:**
   - Update `.gitignore` (§5.6).
   - Add `@angular/cdk`.
   - Remove dead code: `recurring-form.component.ts`, unused budgets month navigation, empty `error.utils.ts` and `app.css`.
   - Remove undefined classes such as `primary-dark`.
1. **Identity direction** (decided *with the user*; see §8):
   - Explore 2–3 visual directions as mockups and pick one.
   - Output: `DESIGN.md` covering the palette (light/dark), typography, radii, elevation, motion principles, iconography and data-visualization rules.
   - Decide the mobile bottom navigation set.
2. **Foundations:**
   - Semantic tokens as CSS variables plus the Tailwind config.
   - Self-hosted font and icons, and the `ui-icon` component.
   - Global focus styles.
   - Consolidated animations: one set in `styles.css`. Today five components re-declare their own keyframes.
3. **Shared UI layer:** the atoms, molecules and organisms from §5.2, each in light and dark, with a quick showcase route reachable in dev only.
4. **Layout:** sidebar, mobile top bar, bottom navigation, drawer, toast placement, auth layout.
5. **Dashboard:**
   - The category list (§5.1) with its pure status/join functions and their unit tests.
   - Restyled summary and the 12-month chart.
6. **Feature migration**, one feature per slice:
   1. Expenses
   2. Incomes
   3. Budgets
   4. Goals
   5. Recurring
   6. Reminders
   7. Settings
   8. Banks
   9. Auth (login, register, OAuth bank callback)

   Each slice replaces hand-rolled markup with shared components and moves touched hardcoded strings to i18n.
7. **Final pass:** an audit against `DESIGN.md`, an accessibility check and a review of motion.

### Branch order with the bugfix plan

My call; the user can override it.

- `fix/functional-bugs` is merged into `master` and then into this branch **before Phase 6** starts. Both touch the same feature files, and the merge avoids repeated conflicts and doing the i18n work twice.
- If B1 is still blocked by then, the rest of the bugfix branch lands without it.
- B4 uses a local confirm modal and is switched to the shared `confirm-dialog` during the Phase 6 migration of Reminders.

## 7. Behavior that must survive (regression checklist)

- Keyboard shortcuts in Expenses and Incomes: Esc, Enter to confirm a delete, Ctrl+Enter to save, Alt+N for a new item.
- 30-second polling in Dashboard, Expenses and Incomes; optimistic modal close on save.
- Budget threshold toasts (budgets effect) and due-reminder toasts (`AlertService`).
- Chart re-labeling when the language changes.
- Safe-area handling (`pt-safe` / `pb-safe`) on Capacitor.
- Banks premium gate and "coming soon" overlay; `isPremium` from localStorage and the API.
- Mobile bottom-sheet actions vs. desktop row actions.
- Dark/light toggle and EN/ES toggle in Settings and in the auth layout.
- `@defer` loading of charts and modals. Each one is kept or removed deliberately, never by accident.
- The month selector rule: future months are disabled.

## 8. Skills to use

- **Lead skill for direction, critique and audit:** `impeccable`, with its project agents `impeccable-finish-reviewer`, `impeccable-motion-reviewer` and `impeccable-documenter`, which produces `DESIGN.md`.
- **Motion:** `emil-design-eng` and `animate`.
- **Accessibility and UX checks:** `ui-ux-pro-max`.
- **Token architecture:** `design-system`.
- **Not used:**
  - `design-taste-frontend`, `banner-design` and `slides`: they target marketing sites and assets, not an app UI.
  - `brand` and `design`: they cover logo and brand identity, so they are relevant only if the user wants a new logo.

## 9. Left to the builder

- Exact component APIs within the rules in §5.2.
- How a test harness is added for pure functions. Vitest is already configured.
- Commit slicing within each phase.
- Whether `@defer` is kept for each modal. When it is dropped, the PR description says why.

## 10. Open, to be decided with the user

- The visual identity itself: Phase 1, done with mockups.
- The mobile bottom navigation set: Phase 1.
