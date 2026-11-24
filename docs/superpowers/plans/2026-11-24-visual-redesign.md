# Spendly Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: the execution mode changes per phase; see the "Execution mode per phase" table. Use superpowers:executing-plans for the native phases and superpowers:subagent-driven-development for the subagent phases. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Spendly a distinctive identity that reads as a finance app and makes the dashboard understandable at a glance. The identity lives in one shared component layer, and every feature is migrated onto it.

**Architecture:**
- Semantic design tokens are CSS variables exposed through Tailwind.
- A shared UI layer (`src/app/shared/ui/`) is organized as atoms, molecules and organisms. Its components are presentational: `input()`/`output()`, OnPush, no data services.
- Overlay behavior comes from Angular CDK.
- Feature pages become containers that own state and compose the shared components.
- Pure logic lives in `src/app/core/utils/` and is unit-tested.

**Tech Stack:** Angular 21 (standalone, zoneless, signals, inline templates), Tailwind 3.4 (`darkMode: 'class'`), `@angular/cdk` 21, Chart.js + ng2-charts, Vitest through `@angular/build:unit-test`, Capacitor 8, PWA.

**Spec:** `docs/superpowers/specs/2026-11-24-visual-redesign-design.md`. Read it fully before any task; section numbers below (§) refer to it. Sibling plan: `docs/superpowers/plans/2026-11-24-functional-bugfixes.md`.

**Repo / branch:** `/home/daybeldiaz/code/spendly-frontend/Spendly-FrontEnd`, branch `redesign/visual-identity` (it already exists, branched from `master`).

## Execution mode per phase

| Phase | Mode | Why |
|---|---|---|
| 0 Housekeeping | **Native** | Small, mechanical, sequential. |
| 1 Identity | **Native, interactive** | Every decision is the user's. A subagent cannot talk to the user. Stop at each gate. |
| 2 Foundations | **Native** | Tokens, fonts and focus styles all touch `styles.css`, `tailwind.config.js` and `index.html`. That is one surface, written in order. |
| 3 Shared UI | **Subagent-driven.** Task 7 (atoms) runs first and alone; then Tasks 8 and 9 run as **2 parallel writers**; the parent then does Task 10. | The molecules and organisms depend only on the atoms. Tasks 8 and 9 live in disjoint folders and each is several files of work. |
| 4 Layout | **Native** | Everything is in `layout/`, the pieces depend on each other, and decisions come from the Phase 1 output. |
| 5 Dashboard | **Native** | The pure functions, the data loading and the UI depend on each other in order. |
| 6 Feature migration | **Subagent-driven, sequential**: one fresh writer and one fresh reviewer per feature, in the order given. | Each feature is 350–940 lines of independent work. A fresh context per feature keeps quality high. The writers run sequentially because they all add keys to `translation.service.ts`. |
| 7 Final pass | **Fresh reviewers only**: `impeccable-finish-reviewer`, `impeccable-motion-reviewer`, and an accessibility review with `ui-ux-pro-max`. | An independent view of the whole branch. |

## Global Constraints

- **No raw palette classes or hex in feature or shared code.** That rules out things like `bg-rose-500`, `text-teal-400` and `#8b5cf6`. Only semantic tokens (§5.2) are allowed. The only exception is category colors from the API (`Category.color`), applied through `[style]`.
- **Semantic token names (exact):**
  - Surfaces: `surface`, `surface-raised`, `surface-sunken`, `border`
  - Text: `ink`, `ink-muted`, `ink-subtle`
  - Brand: `accent`, `accent-contrast`
  - Money: `income`, `expense`
  - Status: `status-ok`, `status-warning`, `status-critical`
  - Neutral bar: `track`, `bar-neutral`
  - Focus: `focus-ring`

  Phase 1 may add tokens to this list, but must not rename these.
- **Presentational components:**
  - Each one is `standalone`, uses `changeDetection: ChangeDetectionStrategy.OnPush`, and only has signal `input()` / `output()` / `model()`.
  - They inject nothing from `core/services`.
  - Selector prefix: `ui-`.
  - Templates are inline, like the rest of the project.
- **Template syntax:** use `@if` / `@for` / `@switch` only. Any `*ngIf` / `*ngFor` in a file you migrate is converted.
- **i18n:**
  - Every user-visible string goes through `TranslationService` (`ts.t()('key')`), with `es` and `en` in `src/app/core/services/translation.service.ts`.
  - Shared components receive already-translated strings as inputs; they do not inject `TranslationService`.
  - Hardcoded strings found in a migrated file are moved to keys.
- **Accessibility baseline (§5.4):**
  - `focus-visible` ring using `focus-ring`.
  - `aria-label` on every icon-only button.
  - `<label for>` with a matching `id` on every input.
  - No clickable `<div>`.
  - No hover-only actions.
  - Zoom allowed.
- **Currency:**
  - Display it with `ui-amount`, which uses Angular `CurrencyPipe` with the code `'DOP'` and `symbolDisplay: 'symbol-narrow'`, in the locale for the current language.
  - No `DOP {{ n }}` string concatenation.
- **Regression checklist (§7) is mandatory.** Every migrated feature keeps its listed behaviors. Each Phase 6 task names the ones that apply.
- **Verification environment** (§3):
  - Production (`https://backend.daybeldiaz.dev/api`) with the user's personal account. The user supplies the credentials at run time; never write them to files, commits or memory.
  - Created records are prefixed `[TEST]` and deleted in the same session.
  - Existing records are never edited or deleted.
  - After cleanup, real budgets show the same `spent` as before the session.
- **Visual check per phase:** Playwright at **375×812** and **1280×800**, in both **light** and **dark** themes, with screenshots saved under the scratch dir, never in the repo.
- **Commands:**
  - Tests: `npx ng test --watch=false`, or a single spec with `--include=<path>`.
  - Build: `npx ng build`.
  - Dev server: `npm start`.
- **Commits:** Conventional Commits; no AI attribution or `Co-Authored-By`; about 400 changed lines per commit as a guide, not a limit.
- **Branch order:** before Phase 6 starts, `fix/functional-bugs` must be merged into `master` and then into this branch (§ "Branch order with the bugfix plan"). If it has not been merged, stop and tell the user.

## Review Focus

1. **Category names with no matching budget or category, including case or accent differences.** `MonthlyStats` keys are category names. A key with no matching `Category` must still render a row, with the fallback icon and the neutral color. The join is an exact string match; never fuzzy. The test is in Task 13.
2. **Overspent budgets and edge values.** A spend above the limit (for example 130%) must clamp the bar to 100% visually, show the real percentage, and have status `critical`. A limit of 0 or less, which the backend forbids but legacy data could contain, must not crash or divide by zero. The test is in Task 13.
3. **Dark default and light theme.** Every component in the showcase and every migrated screen must be legible in both themes. Today the chart grid colors and the date-picker chevrons are hardcoded for dark. This is checked in the Task 10 showcase and in every Phase 6 visual check.
4. **Offline PWA/Capacitor start.** With the network disabled after the first load, fonts and icons still render, with no Google CDN request. The check is in Task 5.
5. **Keyboard-only use.** A user without a mouse can:
   - open and close each dialog (Esc returns focus to its trigger);
   - pick a category with the arrow keys and Enter;
   - reach row actions.

   The tests are in Task 8, and every Phase 6 task checks it.

---

## Phase 0 — Housekeeping (native)

### Task 1: `.gitignore` and untracked tooling

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add the tooling folders.**
  Append them under a `# AI agents and local tooling` header:

  ```
  .agent/
  .agents/
  .claude/
  .atl/
  .impeccable/
  .codegraph/
  ```

- [ ] **Step 2: Narrow `*.txt` to `/*.txt`.**
  The rule now only ignores root-level text files. `public/robots.txt` is already tracked, and new files under `public/` stay addable.
- [ ] **Step 3: Verify.**
  - Run `git status --short`. Expected: only `.gitignore`, `docs/` and `skills-lock.json` appear as changed or untracked, and none of the tooling folders.
  - Run `git check-ignore public/robots.txt`. Expected: no output.
  - Run `git ls-files .claude .agents .agent .atl`. Expected: empty. If anything is listed, run `git rm -r --cached` on it; never delete from disk.
- [ ] **Step 4: Commit.**
  Commit `.gitignore` and `skills-lock.json` as `chore(git): ignore local agent tooling and track skills lock`. Commit `docs/superpowers/` separately as `docs: add redesign and bugfix specs and plans`.

### Task 2: CDK and dead code

**Files:**
- Modify: `package.json`, `package-lock.json`
- Delete: `src/app/features/recurring/recurring-form.component.ts`, `src/app/core/utils/error.utils.ts`, `src/app/app.css`
- Modify: `src/app/app.ts` (remove `styleUrl: './app.css'`)
- Modify: `src/app/features/budgets/budgets.component.ts` (remove the dead members: `prevMonth`, `nextMonth`, `totalBudgeted`, `totalSpent`, `toggleMenu`, `alertOptions`, and every other member a grep shows unused)
- Modify: every file that uses an undefined class

- [ ] **Step 1: Install the CDK.**
  Run `npm i @angular/cdk@^21`. Expected: the installed `@angular/cdk` major matches `@angular/core` (21).
- [ ] **Step 2: Confirm the files are unreferenced, then delete them.**
  Run `grep -rn "recurring-form\|RecurringFormComponent\|error.utils" src`. Expected: only self-references. Then delete the files and the members.
  Keep `periods` in budgets if the bugfix plan's Task 9 is already merged; it is used there.
- [ ] **Step 3: Remove undefined classes.**
  Run `grep -rnoE "(hover:)?(bg|text|border)-(primary-dark|primary-light|secondary-dark|sidebar-dark)|animate-slide-(in-up|down)" src`. Remove each hit. Do not replace it with anything: Phase 6 restyles those elements.
- [ ] **Step 4: Verify.**
  Run `npx ng build && npx ng test --watch=false`. Expected: both pass.
- [ ] **Step 5: Commit.**
  Commit `chore: add angular cdk and remove dead code and undefined classes`.

## Phase 1 — Identity (native, interactive; STOP at every gate)

### Task 3: Direction exploration

**Skills to load first:**
- `.claude/skills/impeccable/SKILL.md` (lead)
- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/emil-design-eng/SKILL.md`

**Files:**
- Create: `docs/design/directions/<a|b|c>/dashboard.html`. These are static mockups and are not part of the app build.

- [ ] **Step 1: Mock up three directions.**
  Produce **3 distinct directions** for the **dashboard only**, each at 375px and 1280px, in light and dark. Each one must show:
  - the §5.1 category list, with at least one ok, one warning, one critical, one yearly ("this year") and two no-budget rows;
  - the balance / income / expense summary;
  - the mobile bottom navigation.

  Use realistic DOP amounts and the real category names and Material icon names from `GET /api/categories`.
  Each direction states in one paragraph what makes it read as **finance**, beyond its color.
- [ ] **Step 2: GATE — the user picks.**
  Present the three directions to the user, with screenshots or open files, and stop. The user picks one, or asks for changes. Allow at most 2 refinement rounds, then ask the user to decide.
- [ ] **Step 3: GATE — the user decides the bottom navigation.**
  Bring a proposal: Banks leaves the bar. The likely set is Dashboard, Expenses, Incomes, Budgets and More, with Goals, Recurring, Reminders, Banks and Settings under More. Stop until the user decides.

### Task 4: `DESIGN.md`

**Files:**
- Create: `DESIGN.md` at the repo root.

- [ ] **Step 1: Write `DESIGN.md`.**
  Use the `impeccable-documenter` agent, or write it inline following impeccable's DESIGN.md format, for the chosen direction. It must contain:
  1. A value for every token in Global Constraints, for both light and dark, as RGB triplets (for example `15 23 42`) so Tailwind alpha works.
  2. Typography: font families, with their self-hostable npm package names (for example `@fontsource-variable/<name>`), and a type scale with names.
  3. Radii, elevation, spacing rhythm.
  4. Motion: durations, easings, and which interactions animate.
  5. Iconography: either keep Material Symbols self-hosted, or name an SVG set. If an SVG set is chosen, include the mapping table for every icon name currently returned by `/api/categories` and every icon used in the templates (find them with `grep -rhoE "material-icons[^>]*>[a-z_]+" src`).
  6. Data-visualization rules for the category list and the 12-month chart.
  7. The bottom-navigation set decided in Task 3.
- [ ] **Step 2: GATE — the user approves `DESIGN.md`.**
- [ ] **Step 3: Commit.**
  Commit `docs(design): add DESIGN.md for the new visual identity` together with the mockups.

## Phase 2 — Foundations (native)

### Task 5: Tokens, fonts, icons, viewport

**Files:**
- Modify: `src/styles.css`, `tailwind.config.js`, `src/index.html`, `ngsw-config.json`, `package.json`
- Create: `src/app/shared/ui/atoms/icon.component.ts`, `src/app/shared/ui/atoms/icon-map.ts`, `src/app/shared/ui/atoms/icon-map.spec.ts`
- Create: `src/app/shared/ui/tokens/read-token.ts`, `src/app/shared/ui/tokens/read-token.spec.ts`

**Interfaces:**
- Produces:
  - Tailwind color utilities for every token, such as `bg-surface`, `text-ink-muted` and `bg-status-critical/20`. Each one is defined as `'rgb(var(--color-<token>) / <alpha-value>)'`.
  - CSS variables `--color-<token>` in `:root` (light) and `.dark` (dark).
  - `readToken(name: string): string` returns `rgb(<triplet>)` from `getComputedStyle(document.documentElement)`, and `''` if the variable is missing. It is used by charts.
  - `resolveIcon(name: string | null | undefined): string` returns the icon identifier for the chosen set, and `FALLBACK_ICON` for an unknown or empty name.
  - `<ui-icon [name]="string" [size]="'sm'|'md'|'lg'" [label]="string | undefined" />`. When `label` is undefined the icon is `aria-hidden="true"`; otherwise it gets `role="img"` and `aria-label`.

- [ ] **Step 1: Write the failing tests.**
  - `icon-map.spec.ts`:
    - `resolveIcon('restaurant')` equals the `DESIGN.md` mapping;
    - `resolveIcon('unknown_xyz')` and `resolveIcon('')` equal `FALLBACK_ICON`.
  - `read-token.spec.ts`:
    - set `document.documentElement.style.setProperty('--color-accent', '1 2 3')` and expect `readToken('accent')` to be `'rgb(1 2 3)'`;
    - expect `readToken('nope')` to be `''`.
- [ ] **Step 2: Watch them fail.**
  Run `npx ng test --watch=false --include=src/app/shared/ui/atoms/icon-map.spec.ts --include=src/app/shared/ui/tokens/read-token.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  Implement the tokens in `styles.css` and `tailwind.config.js` with the values from `DESIGN.md`. Remove `primary`, `secondary` and `danger` only after Phase 6; keep them for now so the unmigrated screens still render.
  Implement `resolveIcon`, `readToken` and `ui-icon`.
- [ ] **Step 4: Watch them pass.**
  Run the same command. Expected: PASS.
- [ ] **Step 5: Self-host the fonts and icons.**
  - Install the font and icon packages named in `DESIGN.md` and import them in `styles.css`.
  - Delete the two `fonts.googleapis.com` `<link>` tags and the preconnects in `index.html`.
  - Set the viewport to `width=device-width, initial-scale=1, viewport-fit=cover`.
  - Remove the global `user-select: none` from `body`, if present.
  - Make sure `ngsw-config.json` asset groups include the font files (`/**/*.woff2`).
- [ ] **Step 6: Check offline start.**
  Run `npx ng build`, serve `dist/` with the service worker (`npx http-server dist/spendly-pwa/browser -p 8080`), load the app once, then switch DevTools to offline and reload.
  Expected: the text renders in the new font, the icons render, and there is no request to `googleapis`.
- [ ] **Step 7: Commit.**
  Commit `feat(ui): add semantic tokens, self-hosted fonts and icon component`.

### Task 6: Focus and motion base

**Files:**
- Modify: `src/styles.css`
- Modify: the five components that re-declare keyframes (dashboard, budgets, settings, banks, login). Remove their local `@keyframes` and use the global classes.

- [ ] **Step 1: Add global focus and motion.**
  - Add a global `:focus-visible` style: a 2px `focus-ring` outline with a 2px offset.
  - Define the motion utilities from `DESIGN.md` once, and add `@media (prefers-reduced-motion: reduce)`, which disables non-essential motion.
- [ ] **Step 2: Verify.**
  - Run `grep -rn "@keyframes" src/app`. Expected: no output.
  - Run `npx ng build`. Expected: it passes.
  - Tab through the login page. Expected: a visible ring on every control.
- [ ] **Step 3: Commit.**
  Commit `feat(ui): global focus-visible and consolidated motion`.

## Phase 3 — Shared UI layer (subagent-driven)

All components live under `src/app/shared/ui/`. Each component is one `.ts` file with an inline template. Writers in Tasks 7–9 must not edit files outside their own folder, `translation.service.ts`, `styles.css` or `tailwind.config.js`. If a writer needs a token or a key, it reports it, and the parent adds it.

### Task 7: Atoms (runs first, alone)

**Files:**
- Create in `src/app/shared/ui/atoms/`:
  - `button.component.ts`
  - `badge.component.ts`
  - `amount.component.ts`
  - `progress-bar.component.ts`
  - `spinner.component.ts`
  - `skeleton.component.ts`
  - `toggle.component.ts`
  - `field-label.component.ts`
  - `index.ts`, the barrel
- Test: `amount.component.spec.ts`, `progress-bar.component.spec.ts`

**Interfaces (Produces):**
- `button[uiButton]`, an attribute component on the native `<button>`.
  - Inputs: `variant: 'primary'|'secondary'|'ghost'|'danger' = 'primary'`, `size: 'sm'|'md'|'lg' = 'md'`, `loading = false`.
  - While loading it sets `aria-busy` and `disabled`, and shows `ui-spinner`.
- `ui-badge`. Inputs: `tone: 'neutral'|'income'|'expense'|'ok'|'warning'|'critical' = 'neutral'`. Content is projected.
- `ui-amount`.
  - Inputs: `value: number` (required), `tone: 'neutral'|'income'|'expense' = 'neutral'`, `size: 'sm'|'md'|'lg'|'xl' = 'md'`, `locale: string = 'en-US'`.
  - The container passes `'es-DO'` or `'en-US'` according to the language.
- `ui-progress-bar`.
  - Inputs: `percent: number` (required; it may be over 100 or negative), `status: BudgetStatus | 'neutral' = 'neutral'`, `thickness: 'thin'|'regular' = 'regular'`, `label: string` (required; used for `aria-label`).
  - Renders `role="progressbar"`, with `aria-valuenow` set to the real percent rounded, `aria-valuemin=0`, and `aria-valuemax=100`.
  - The visual width is clamped to the range 0–100.
- `ui-spinner`, `ui-skeleton` (`shape: 'line'|'block'|'circle'`), `ui-field-label` (`for: string` required; content projected).
- `ui-toggle`, a `ControlValueAccessor` built on `<button role="switch" [attr.aria-checked]>`. Input: `label: string` (required).
- `BudgetStatus` is imported from `src/app/core/utils/budget-status.ts`. If Task 13 has not run yet, create that file now with only `export type BudgetStatus = 'ok' | 'warning' | 'critical';`.

- [ ] **Step 1: Write the failing tests.**
  - `progress-bar`:
    - `percent=130` → the inner bar width style is `100%` and `aria-valuenow` is `"130"`;
    - `percent=-5` → width `0%`;
    - `status='critical'` → the inner bar has class `bg-status-critical`.
  - `amount`: `value=45200`, `locale='en-US'` → the text contains `45,200`.
- [ ] **Step 2: Watch them fail.**
  Run `npx ng test --watch=false --include='src/app/shared/ui/atoms/*.spec.ts'`. Expected: FAIL.
- [ ] **Step 3: Implement all the atoms.**
  Apply the `DESIGN.md` values through token classes only.
- [ ] **Step 4: Watch them pass.**
  Run the same command. Expected: PASS.
- [ ] **Step 5: Commit.**
  Commit `feat(ui): add shared atoms`.

### Task 8: Overlays and form molecules (parallel writer A)

**Files:**
- Create in `src/app/shared/ui/organisms/`:
  - `dialog.service.ts`
  - `dialog-shell.component.ts`
  - `confirm-dialog.component.ts`
  - `action-sheet.component.ts`
  - `category-picker.component.ts`
- Create in `src/app/shared/ui/molecules/`:
  - `form-field.component.ts`
  - `currency-input.component.ts`
  - `segmented-control.component.ts`
- Test: `confirm-dialog.component.spec.ts`, `category-picker.component.spec.ts`

**Interfaces:**
- Consumes: the atoms from Task 7, and `ui-icon`.
- Produces:
  - `UiDialogService` (`providedIn: 'root'`), wrapping CDK `Dialog`:
    - `open<C, D, R>(component: Type<C>, config: { data?: D; size?: 'sm'|'md'|'lg'; sheetOnMobile?: boolean }): DialogRef<R, C>`.
    - Esc closes the dialog. The backdrop closes it unless `disableClose` is set. Focus is trapped and restored. The body scroll is locked. Stacking is handled by CDK; no manual z-index.
    - `confirm(opts: { title: string; message: string; confirmLabel: string; cancelLabel: string; tone?: 'danger'|'primary' }): Promise<boolean>`. It resolves `false` on Esc or backdrop.
  - `ui-dialog-shell`. Inputs: `title: string` (required), `closeLabel: string` (required). Output: `closed`. Slots: the default content and `[uiDialogFooter]`.
  - `ui-action-sheet`, a bottom-anchored shell used through `open(..., { sheetOnMobile: true })`. On viewports of 1024px or more, it renders as a centered dialog.
  - `ui-form-field`. Inputs: `label: string`, `fieldId: string` (required), `hint?: string`, `error?: string | null`. It projects the control. The `error` is linked through `aria-describedby`.
  - `ui-currency-input`, a CVA (`number | null`). It reuses the logic of the `appCurrencyInput` directive (`src/app/shared/directives/currency-input.directive.ts`); it does not re-implement parsing. Input: `inputId: string` (required).
  - `ui-segmented-control<T>`, a CVA. Input: `options: { value: T; label: string }[]`. It uses a `radiogroup` with arrow-key navigation.
  - `ui-category-picker`, a CVA (`number | null`, the category id), built on CDK `Overlay` and `CdkListbox`. Inputs: `categories: Category[]`, `placeholder: string`, `label: string`. Up/Down move the selection, Enter selects, Esc closes.

- [ ] **Step 1: Write the failing tests.**
  - `confirm-dialog`:
    - `confirm()` resolves `true` when the confirm button is clicked;
    - it resolves `false` on `Escape` keydown;
    - after closing, `document.activeElement` is the trigger button.
  - `category-picker`:
    - opening it, then `ArrowDown` + `Enter`, sets the form value to the second category's id;
    - `Escape` closes the overlay without changing the value.
- [ ] **Step 2: Watch them fail.**
  Run the two specs. Expected: FAIL.
- [ ] **Step 3: Implement everything in this task.**
- [ ] **Step 4: Watch them pass.**
  Run the two specs. Expected: PASS.
- [ ] **Step 5: Commit.**
  Commit `feat(ui): add CDK dialogs and form molecules`.

### Task 9: Display molecules (parallel writer B)

**Files:**
- Create in `src/app/shared/ui/molecules/`:
  - `category-badge.component.ts`
  - `list-row.component.ts`
  - `empty-state.component.ts`
  - `page-header.component.ts`
  - `pagination.component.ts`
  - `month-selector.component.ts`
- Create: `src/app/core/utils/month.ts`, `src/app/core/utils/month.spec.ts`

**Interfaces:**
- Consumes: the atoms from Task 7, `ui-icon`, and `UiDialogService`. `UiDialogService` is only used by the month selector's picker; if Task 8 is not merged yet, the month selector uses a CDK `Overlay` directly.
- Produces:
  - `isFutureMonth(year: number, month1to12: number, today: Date): boolean`.
  - `shiftMonth(date: Date, delta: number): Date`, which returns the first day of the target month.
  - `ui-category-badge`. Inputs: `name: string`, `color: string` (hex from the API), `icon: string` (the Material name, resolved through `resolveIcon`). The background is the category color at 15% alpha; the icon uses the category color.
  - `ui-list-row`. Input: `interactive = false`; when true it renders as a `<button>`. Slots: `[uiRowLeading]`, default, `[uiRowTrailing]`, `[uiRowBelow]`.
  - `ui-empty-state`. Inputs: `icon`, `title`, `description?`. Slot: `[uiEmptyAction]`.
  - `ui-page-header`. Inputs: `title`, `subtitle?`. Slot: `[uiHeaderActions]`.
  - `ui-pagination`. Inputs: `page` (0-based), `totalPages`, `prevLabel`, `nextLabel`. Output: `pageChange: number`, clamped to the range 0..totalPages-1.
  - `ui-month-selector`. `model()` `value: Date`; input `locale: string`. Previous and next buttons; the label opens a month/year picker. Future months are disabled and the next button is disabled on the current month.

- [ ] **Step 1: Write the failing tests.**
  - `month.spec.ts`:
    - `isFutureMonth(2026, 12, new Date(2026, 10, 24))` is `true`;
    - `isFutureMonth(2026, 11, …)` with the same date is `false`;
    - `shiftMonth(new Date(2026, 0, 31), -1)` equals `new Date(2025, 11, 1)`.
- [ ] **Step 2: Watch them fail.**
  Run the spec. Expected: FAIL.
- [ ] **Step 3: Implement everything in this task.**
- [ ] **Step 4: Watch them pass.**
  Run the spec. Expected: PASS.
- [ ] **Step 5: Commit.**
  Commit `feat(ui): add display molecules and month helpers`.

### Task 10: Showcase route (after Tasks 8 and 9; native)

**Files:**
- Create: `src/app/shared/ui/showcase/ui-showcase.component.ts`
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Add the route.**
  Add the route `__ui` with `canMatch: [() => isDevMode()]`, outside `authGuard`. It renders every component in every variant, including an open dialog trigger, a confirm trigger and a picker.
- [ ] **Step 2: Run the visual check.**
  Use Playwright at 375 and 1280, in light and dark. Then do a keyboard pass: Tab through everything, and open and close each overlay with Esc. Expected: everything is legible and the focus ring is visible.
- [ ] **Step 3: Check production builds.**
  Run `npx ng build`. Expected: `/__ui` does not match in production; it redirects to the dashboard through `**`.
- [ ] **Step 4: Commit.**
  Commit `feat(ui): add dev-only component showcase`.

## Phase 4 — Layout (native)

### Task 11: Main layout, sidebar, navigation, toasts

**Files:**
- Modify: `src/app/layout/main-layout/main-layout.component.ts`, `src/app/layout/sidebar/sidebar.component.ts`, `src/app/shared/components/toast/toast.component.ts`

- [ ] **Step 1: Mobile bottom navigation.**
  Use the `DESIGN.md` set. Every item gets an icon and a label at a readable size (no 9px labels). `routerLinkActive` uses a single active style built from tokens. Banks is not in the bar.
- [ ] **Step 2: "More" drawer.**
  The drawer opens through `UiDialogService` with `sheetOnMobile`, or as a CDK overlay. It closes on Esc and backdrop, and has `aria-label` on its trigger.
- [ ] **Step 3: Desktop sidebar.**
  All links use the same active style built from tokens; no more teal, rose and primary per link. Show the user block and logout.
- [ ] **Step 4: Toasts and padding.**
  - On screens under 1024px, toasts sit above the bottom navigation, offset by its height plus the `pb-safe` inset. On desktop they stay bottom-right.
  - Remove the doubled top padding: the content wrapper owns the page padding, and pages stop adding their own `p-6` / `p-8`. Pages are cleaned up in Phase 6.
  - Move the update-available modal and the notification dropdown onto `UiDialogService` / `Overlay`, and their strings onto keys.
- [ ] **Step 5: Visual check.**
  Use Playwright at 375 and 1280, in light and dark: every route is reachable; the notifications open and close; the safe area is respected.
- [ ] **Step 6: Commit.**
  Commit `feat(layout): redesign navigation, sidebar and toast placement`.

### Task 12: Auth layout

**Files:**
- Modify: `src/app/layout/auth-layout/auth-layout.component.ts`

- [ ] **Step 1: Restyle the auth layout.**
  Apply the `DESIGN.md` direction. Keep the theme and language toggles and give them `aria-label`s. Remove the pulsing blurred blobs unless `DESIGN.md` keeps them.
- [ ] **Step 2: Visual check, then commit.**
  Commit `feat(layout): redesign auth layout`.

## Phase 5 — Dashboard (native)

### Task 13: Pure logic for the category list

**Files:**
- Create/complete: `src/app/core/utils/budget-status.ts`, `src/app/core/utils/budget-status.spec.ts`
- Create: `src/app/core/utils/category-spending.ts`, `src/app/core/utils/category-spending.spec.ts`

**Interfaces (Produces):**

```ts
// budget-status.ts
export type BudgetStatus = 'ok' | 'warning' | 'critical';
export const DEFAULT_WARNING_THRESHOLD = 75;
export const DEFAULT_CRITICAL_THRESHOLD = 90;
export function budgetPercent(spent: number, limit: number): number; // Math.round(spent / limit * 100); limit <= 0 → (spent > 0 ? 100 : 0)
export function budgetStatus(
  spent: number,
  limit: number,
  warningThreshold?: number | null,
  criticalThreshold?: number | null,
): BudgetStatus; // critical if pct >= critical (default 90) or pct > 100; warning if pct >= warning (default 75); else ok

// category-spending.ts
export interface CategorySpendingBudget {
  scope: 'month' | 'year';
  spent: number;   // the budget's own spent from the API (bugfix B9)
  limit: number;
  percent: number; // budgetPercent(spent, limit)
  status: BudgetStatus;
}
export interface CategorySpendingRow {
  categoryName: string;   // the MonthlyStats key
  categoryId: number | null;
  color: string | null;   // Category.color, or null when there is no match
  icon: string | null;    // Category.icons, or null when there is no match
  spent: number;          // this month
  shareOfTotal: number;   // Math.round(spent / monthTotal * 100)
  budget: CategorySpendingBudget | null;
}
export function buildCategorySpendingRows(
  stats: MonthlyStats,
  budgets: Budget[],        // monthly for the selected month plus yearly for the selected year
  categories: Category[],
): CategorySpendingRow[];
```

Rules from §5.1:
- Rows are only built for stats entries with a value greater than 0.
- Sort by `spent` descending, then by `categoryName` ascending.
- Match budgets on `budget.category?.name === categoryName` exactly:
  - prefer `period === 'MONTHLY'` (scope `month`);
  - otherwise `period === 'YEARLY'` (scope `year`);
  - otherwise `budget: null`. `DAILY` and `WEEKLY` are ignored.
- Among several candidates in the same scope, pick the latest `startDate`.

- [ ] **Step 1: Write the failing tests.**
  - `budget-status.spec.ts`:
    - `(740, 1000)` → `'ok'`;
    - `(750, 1000)` → `'warning'`;
    - `(900, 1000)` → `'critical'`;
    - `(1300, 1000)` → `'critical'` with `budgetPercent` = 130;
    - custom thresholds `(600, 1000, 50, 80)` → `'warning'`;
    - `(10, 0)` → `'critical'` and percent 100;
    - `(0, 0)` → `'ok'` and percent 0.
  - `category-spending.spec.ts`. The stats are `{ Food: 45200, Home: 38000, Transport: 18900, Leisure: 0, Ghost: 500 }`:
    - `Leisure` is excluded;
    - the order is Food, Home, Transport, Ghost;
    - `shareOfTotal` for Food is `Math.round(45200 / 102600 * 100)` = 44;
    - Food with a MONTHLY budget (limit 50000, spent 45200) → scope `month`, status `critical`;
    - Home with only a YEARLY budget (spent 120000, limit 500000) → scope `year`, percent 24;
    - Transport with only a WEEKLY budget → `budget: null`;
    - two MONTHLY budgets for Food → the later `startDate` wins;
    - `Ghost`, with no category match, → `categoryId`, `color` and `icon` are `null` and the row is still present;
    - empty stats → `[]`.
- [ ] **Step 2: Watch them fail.**
  Run `npx ng test --watch=false --include=src/app/core/utils/budget-status.spec.ts --include=src/app/core/utils/category-spending.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Watch them pass.**
  Run the same command. Expected: PASS.
- [ ] **Step 5: Commit.**
  Commit `feat(dashboard): add budget status and category spending logic`.

### Task 14: Dashboard data and category list UI

**Files:**
- Create: `src/app/features/dashboard/category-spending-list.component.ts`. It is presentational and lives in the feature, because it is dashboard-specific.
- Modify: `src/app/features/dashboard/dashboard.component.ts`
- Modify: `src/app/features/expenses/expenses.component.ts`, so it reads query params
- Modify: `translation.service.ts`, with the new keys below

**Interfaces:**
- Consumes: `buildCategorySpendingRows`, `budgetStatus`, `ApiService.getMonthlyBudgets(year, month)`, `ApiService.getBudgets(page, size)`, `ApiService.getCategories()`, and the shared atoms and molecules.
- Produces:
  - `<app-category-spending-list [rows] [monthTotal] [locale] [hasAnyBudget] (rowSelected)="CategorySpendingRow">`.
  - Expenses accepts `?category=<id>&month=<1-12>&year=<yyyy>` and applies them through `ExpenseStateService.setFilter(id)` and `setDateFilter(month, year)`.

- [ ] **Step 1: Load the data.**
  - In `dashboard.component.ts`, together with the existing stats, load `getMonthlyBudgets(year, month)` and the yearly budgets: page through `getBudgets(page, 100)` until `page.number + 1 >= page.totalPages`, then keep `period === 'YEARLY' && year === selectedYear`.
  - Load the categories once.
  - Combine everything with `buildCategorySpendingRows` into a `computed` signal.
  - Remove the doughnut chart and its options.
  - Keep the 30-second polling, and refresh the budgets on the same tick.
- [ ] **Step 2: Build the category list component.**
  Each row is a `ui-list-row` with `interactive`, containing:
  - `ui-category-badge` (with fallback when color or icon is `null`);
  - the translated category name (`ts.translateCategory`);
  - the `ui-amount` for `spent`;
  - in `uiRowBelow`, the `ui-progress-bar`:
    - with a budget: `status`, `percent` and the text `dashboard.cat_of_limit` (for example "of RD$ 50,000"), or `dashboard.cat_of_limit_year` (for example "of RD$ 500,000 this year") when the scope is `year`;
    - without a budget: `thickness='thin'`, `status='neutral'`, `percent = shareOfTotal`, and the text `dashboard.cat_share` (for example "13% of total").
  - When `hasAnyBudget` is false, one discreet line after the list says `dashboard.no_budgets_hint` and links to `/budgets`.
  - An empty month shows `ui-empty-state` with `dashboard.no_expenses_title`.
- [ ] **Step 3: Add the keys** (es / en):

  | Key | es | en |
  |---|---|---|
  | `dashboard.spending_title` | Gastos de {{month}} | {{month}} expenses |
  | `dashboard.cat_of_limit` | de {{amount}} | of {{amount}} |
  | `dashboard.cat_of_limit_year` | de {{amount}} este año | of {{amount}} this year |
  | `dashboard.cat_share` | {{pct}}% del total | {{pct}}% of total |
  | `dashboard.no_budgets_hint` | Crea presupuestos para ver cómo vas en cada categoría | Create budgets to see how you're doing in each category |
  | `dashboard.no_expenses_title` | Sin gastos este mes | No expenses this month |

- [ ] **Step 4: Tapping a row.**
  A row tap calls `router.navigate(['/expenses'], { queryParams: { category: row.categoryId, month, year } })`. Omit `category` when `categoryId` is null.
  Expenses reads the params once on init and applies the filters.
- [ ] **Step 5: Summary and chart.**
  Restyle the summary with `ui-amount`. The 12-month chart takes its colors from `readToken('income')`, `readToken('expense')`, `readToken('border')` and `readToken('ink-muted')`, recomputed when the theme changes (an `effect` on `ThemeService`). Keep re-labeling the chart when the language changes. Replace the month modal with `ui-month-selector`.
- [ ] **Step 6: Check the dashboard.**
  Run the visual check at 375 and 1280, in light and dark, with real data. Then use a `[TEST]` budget on a category that has no budget this month, plus `[TEST]` expenses, to show the ok, warning and critical states. Tap a row and confirm Expenses opens filtered. Clean up and confirm the real budgets' `spent` is unchanged.
- [ ] **Step 7: Commit.**
  Commit `feat(dashboard): replace doughnut with per-category spending list`.

## Phase 6 — Feature migration (subagent-driven, sequential)

**Precondition:** the bugfix branch is merged (see Global Constraints).

**Every task below follows the same recipe:**
1. Replace the hand-rolled markup with shared components:
   - modals → `UiDialogService` / `ui-dialog-shell`;
   - delete confirmations → `UiDialogService.confirm`;
   - bottom sheets → `sheetOnMobile`;
   - category dropdowns → `ui-category-picker`;
   - labels and inputs → `ui-form-field` + `ui-field-label`;
   - money inputs → `ui-currency-input`;
   - money display → `ui-amount`;
   - lists → `ui-list-row`;
   - empty states → `ui-empty-state`;
   - headers → `ui-page-header`;
   - pagination → `ui-pagination`;
   - buttons → `button[uiButton]`.
2. Move methods called in the template (`getEmptyRows`, `calculateProgress`, `getSelectedCategory`, and others) into `computed` signals.
3. Use semantic tokens only; remove the page-level `p-6` / `p-8`.
4. Move every hardcoded string in the file onto keys.
5. Convert `*ngIf` / `*ngFor` to control flow.
6. Make row actions reachable without hover. On desktop, use a visible actions menu button per row; on mobile, use the bottom sheet.
7. For each `@defer` block in the file, decide deliberately whether to keep it or drop it, and give the reason in the commit body.
8. Run the visual check (375 and 1280, light and dark) and a keyboard pass, then commit as `refactor(<feature>): migrate to shared ui`.

The reviewer for each task checks the diff against this recipe, against §5.4, and against the regression items listed for that task.

| Task | Feature | File(s) | Regression items to keep (§7) |
|---|---|---|---|
| 15 | Expenses | `features/expenses/expenses.component.ts` | Esc / Enter / Ctrl+Enter / Alt+N shortcuts; 30s polling; optimistic close; date and category filters (including the Task 14 query params); mobile sheet vs. desktop actions; pagination size 6 (the fixed-height placeholder rows go away) |
| 16 | Incomes | `features/incomes/incomes.component.ts` | Same as Expenses, minus categories |
| 17 | Budgets | `features/budgets/budgets.component.ts` | Use `budgetStatus` / `budgetPercent` (remove `getProgressColor`); threshold toasts effect (`:603-623`); recurring toggle and repeat months; advanced thresholds; Monthly/Yearly choice (bugfix Task 9) |
| 18 | Goals | `features/goals/goals.component.ts` | History modal with contribution delete; create / edit / add_funds modes; `app-date-picker` (restyle it to tokens; fix its light-mode chevrons); use `ui-currency-input` instead of `type=number` |
| 19 | Recurring | `features/recurring/recurring.component.ts` | Frequency and weekday as `ui-segmented-control` or a picker with translated options (no native `<select>` with English options); indefinite / fixed occurrences |
| 20 | Reminders | `features/reminders/reminders.component.ts` | Replace the bugfix's temporary delete modal with `UiDialogService.confirm`; `ui-currency-input` for the amount; `AlertService` toasts unchanged |
| 21 | Settings | `features/settings/settings.component.ts` | Three tabs as `ui-segmented-control` (or tabs with `role="tablist"`); dark-mode `ui-toggle`; EN/ES switch; `getUserId()` from the bugfix |
| 22 | Banks | `features/banks/banks.component.ts` | Premium gate plus "coming soon" overlay; `isPremium` source; disconnect through `confirm`; no `alert()` |
| 23 | Auth | `features/auth/login`, `register`, `oauth-callback` | Show/hide password with `aria-label`; error box; register redirect after 2s; OAuth bank callback states moved to keys (today they are hardcoded Spanish); remove the local `.glass-card` override |

### Task 24: Remove legacy tokens

**Files:**
- Modify: `tailwind.config.js`, `src/styles.css`

- [ ] **Step 1: Find the leftovers.**
  Run `grep -rnE "(bg|text|border|from|to|ring|shadow)-(primary|secondary|danger|gray|slate|rose|teal|amber|green|red|purple|indigo|blue|orange)-" src/app`. Expected: no output. Migrate anything that remains.
- [ ] **Step 2: Remove the legacy definitions.**
  Remove `primary`, `secondary` and `danger` from `tailwind.config.js`, and remove the `.glass` / `.glass-card` classes from `styles.css` if nothing uses them.
- [ ] **Step 3: Verify.**
  Run `npx ng build && npx ng test --watch=false`. Expected: both pass.
- [ ] **Step 4: Commit.**
  Commit `chore(ui): remove legacy color tokens`.

## Phase 7 — Final pass (fresh reviewers)

### Task 25: Audit

- [ ] **Step 1: Design review.**
  Run `impeccable-finish-reviewer` against `DESIGN.md` and the approved Phase 1 mockup. Apply only material fixes.
- [ ] **Step 2: Motion review.**
  Run `impeccable-motion-reviewer` on dialogs, sheets, navigation and the category list. Check reduced-motion behavior.
- [ ] **Step 3: Accessibility review.**
  Run an accessibility review with the `ui-ux-pro-max` checklist: keyboard-only through every route, `aria-label`s, contrast in both themes, zoom at 200%.
- [ ] **Step 4: Regression pass.**
  Walk through the §7 checklist in production with the `[TEST]` data rules, then clean up and confirm the real budgets are unchanged.
- [ ] **Step 5: Report.**
  Report to the user: the commits per phase, the test results, the screenshots, any open findings, and anything skipped. Pushing and merging are the user's decision.
