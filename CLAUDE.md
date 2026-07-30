# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Spendly is an Angular 21 personal-finance PWA (income/expense/budget/goal tracking) packaged for web + Android/iOS via Capacitor.

## Commands

```bash
npm start          # generate env + ng serve on :4200
npm run build      # generate PROD env + ng build → dist/spendly-pwa
npm test           # unit tests (Vitest via @angular/build:unit-test)
npm run config     # (re)generate src/environments/environment.ts only
npm run mobile:sync   # build + npx cap sync (android/ios variants also exist)
```

- **Env generation is required before serve/build.** `scripts/set-envs.js` writes `src/environments/environment.ts` from `process.env.API_URL` (default `https://backend.daybeldiaz.dev/api`). `npm start`/`npm run build` run it automatically; running bare `ng serve`/`ng build` skips it (uses the last-generated file). Set a different backend with `API_URL=... npm start`.
- **Single test:** `npx ng test` then filter, or `npx vitest run path/to.spec.ts`.
- No linter is configured; formatting is Prettier (config in `package.json`: `printWidth: 100`, `singleQuote: true`). Component templates use the `angular` parser.

## Architecture

**Angular 21, fully standalone, ZONELESS.** `app.config.ts` uses `provideZonelessChangeDetection()` — there is no zone.js. Change detection is driven by **signals**; write state as `signal`/`computed`/`effect` and prefer `OnPush`. Avoid patterns that rely on zone.js auto-detection (e.g. mutating plain fields and expecting the view to update).

**Templates are inline** in the `@Component` decorator (there are almost no `.html` files). Edit markup inside the `.ts` file.

### Layers
- `core/` — app-wide singletons: `services/`, `guards/`, `interceptors/`, `models/api.models.ts` (all backend DTOs), `constants/`.
- `features/` — one folder per route, each a lazy-loaded standalone component (see `app.routes.ts`).
- `layout/` — `main-layout` (authed shell: sidebar + mobile bottom-nav + drawer + notifications) and `auth-layout`.
- `shared/` — reusable UI, icons, charts, directives (details below).

### Data flow: ApiService + CacheService + State services
- **`ApiService`** wraps `HttpClient` against `environment.apiUrl`. Read methods go through an in-memory **`CacheService`** (2-minute TTL) with offline fallback; writes call `invalidateDependencies(type)` to clear the right cache keys (defined in `core/constants/cache.constants.ts`). When adding endpoints, follow this cache/invalidate pairing.
- **`*-state.service.ts`** (expense, income, budget, goal, recurring, reminders) are the source of truth for feature screens. They hold signals, do **optimistic updates**, and typically **fetch all pages** (forkJoin over paginated endpoints) then filter client-side. Feature components `inject()` these services rather than calling `ApiService` directly for list state. `expense-state` also updates `budget-state` on writes.
- `data-preload.service` warms caches after login; `alert.service` polls for budget alerts (started/stopped by `main-layout`).

### Auth
- JWT stored in `localStorage` under `spendly_token` (also `spendly_user`, `spendly_premium`). `AuthService` decodes the JWT client-side.
- `authInterceptor` attaches the token, **proactively logs out on locally-detected expiry** (before hitting the server), and logs out on a server `401`.
- Routes are guarded by `authGuard` / `publicGuard` (`core/guards/auth.guard.ts`). Authed routes render inside `MainLayoutComponent`.

### i18n & formatting
- Custom `TranslationService` (no i18n library), Spanish/English. Use `ts.t()('key')` in templates (it's a signal, so it reacts to language changes) and `ts.translateCategory(name)` for backend category names (accent/locale-normalized). Add UI strings to the dictionary in `translation.service.ts`.

### Design system (editorial / theme-aware) — use this, don't hardcode
The UI runs on **semantic design tokens**, not raw Tailwind colors. Both light and dark are first-class.
- Tokens are defined as CSS variables in `src/styles.css` (`:root` + `.dark`) and exposed to Tailwind in `tailwind.config.js`. Use token classes: `bg-surface`/`bg-surface-2`/`bg-surface-3`, `text-content`/`text-content-muted`/`text-content-subtle`, `border-divider`, `text-primary`/`bg-primary`/`text-primary-ink`/`text-primary-on`, `text-success`/`text-expense`/`text-warning`. **Do not introduce `gray-*`/`slate-*`/hardcoded hex** — the whole app was migrated off them.
- `ThemeService` toggles the `.dark` class on `<html>` (default dark, persisted in `localStorage`). The brand accent (terracotta) and neutrals are theme-aware via CSS vars, so a single token change re-skins everything.
- Typography: `.font-display` = Fraunces serif (headings + large figures), Inter for body, `.tabular` for money figures, `.eyebrow` for small caps labels. Fonts load via CDN link in `src/index.html`.
- **UI kit** in `shared/components/ui/` (`ui-card`, `ui-button`, `ui-badge`, `ui-input` directive, `ui-section-header`, `ui-progress`, `ui-stat`, `ui-empty-state`; barrel `index.ts`). Prefer these over ad-hoc markup. `.glass-card` still exists but is redefined to the editorial surface.
- **Icons:** never use Material Icons. Use `<app-icon name="...">` (Lucide via `lucide-angular`). Names may be legacy Material names — `shared/icons/lucide.ts` maps Material→Lucide and registers the icon set (registered in `app.config.ts`). New icons must be imported + added to `LUCIDE_ICON_SET` there. Category icons use the `categoryIcon` pipe (`shared/icons/category-icon.pipe.ts`), which picks a representative icon by category name.
- **Charts:** ng2-charts/chart.js. Colors/animations come from `shared/charts/chart-theme.ts` (palette + `chartAxisColor()`/`chartGridColor()`/income/expense colors read from CSS vars). Re-apply on theme/lang change (see `dashboard.component.ts` effect).

### PWA / mobile
Service worker is enabled in production builds only (`provideServiceWorker`, `isDevMode()`). `UpdateService` surfaces new-version prompts. Capacitor (`capacitor.config.ts`) wraps the built `dist/` for Android/iOS; safe-area CSS utilities (`pt-safe`/`pb-safe`) and touch tweaks live in `styles.css`.



# Angular Architecture & Engineering Skills

## 🚀 Core Principles & Angular Features
- **Standalone Components**: Always use `standalone: true` for components, directives, and pipes. Avoid adding new features to `NgModule` unless maintaining legacy code.
- **State Management with Signals**:
  - Prefer Angular **Signals** (`signal()`, `computed()`, `input()`, `output()`) for reactive local state and component IO.
  - Use `toSignal()` to convert RxJS Observables to Signals in templates to minimize the `async` pipe overhead.
- **Control Flow Syntax**: Use modern control flow syntax (`@if`, `@for`, `@switch`) instead of legacy structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`).
- **Deferred Loading**: Use `@defer (on viewport)` or other triggers for heavy UI sections or below-the-fold components to improve initial load time.

## 📐 Component Architecture
- **Component Limits**: Keep components lean (< 150 lines). Move complex async processing, API calls, or business logic into Injectable Services.
- **Inputs and Outputs**:
  - Use signal inputs: `readonly myInput = input<string>();` or `readonly requiredInput = input.required<number>();`.
  - Use signal outputs: `readonly myEvent = output<string>();`.
- **Change Detection**: Use `changeDetection: ChangeDetectionStrategy.OnPush` on all components.

## 🛠️ TypeScript & RxJS Standards
- **Strict Typing**: Strict TypeScript mode is enabled. Do not use `any`. Define strong interfaces/types for model objects and API payloads.
- **RxJS Best Practices**:
  - Use `takeUntilDestroyed()` (from `@angular/core/rxjs-interop`) inside injection contexts to prevent memory leaks in subscriptions.
  - Prefer declarative RxJS pipe operators (`switchMap`, `catchError`, `combineLatest`) over manual nested subscriptions `.subscribe()`.
- **Dependency Injection**: Use the modern `inject()` function instead of constructor injection:
  ```typescript
  private readonly userService = inject(UserService);
