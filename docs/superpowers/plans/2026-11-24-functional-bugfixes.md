# Functional Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended for this plan) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 9 verified functional bugs (B1–B9) and limit budgets to MONTHLY/YEARLY (C1) without changing the look of any screen.

**Architecture:** Each bug is fixed with the smallest change and gets its own commit. Where the behavior can be unit-tested, the test is written first (RED) and then made to pass (GREEN). UI-only fixes record a manual browser check in the commit body. C1 spans the backend (Spring Boot) and the frontend (Angular).

**Tech Stack:**
- Frontend: Angular 21 (standalone, zoneless, signals), Vitest via `@angular/build:unit-test`.
- Backend: Spring Boot, JUnit 5 + Mockito (`./mvnw`).

**Spec:** `docs/superpowers/specs/2026-11-24-bugfix-design.md`. Read it before starting. The visual redesign spec (`2026-11-24-visual-redesign-design.md`) explains why this branch must stay free of visual changes.

**Repositories and branches:**

| Repo | Path | Branch |
|---|---|---|
| Frontend | `/home/daybeldiaz/code/spendly-frontend/Spendly-FrontEnd` | `fix/functional-bugs`, created from `master` |
| Backend | `/home/daybeldiaz/code/spendly-api/Spendly-Api` | `fix/budget-periods`, created from `develop` |

**Execution mode:** **Native, meaning direct with no subagents.**
- Every task is 1–3 files, mechanical, and independent of the others.
- Starting a subagent per task costs more than the task itself.
- Run one fresh reviewer over both branches at the end.

## Global Constraints

- No visual changes: do not touch classes, layout or markup structure except the exact lines named in a task.
- Every new UI string goes into `TranslationService.dictionary` (`src/app/core/services/translation.service.ts`) with both `es` and `en`. Toasts take translation **keys**, because the toast component translates them at render time. See `ns.show('notif.expense_deleted', 'success')` in `expenses.component.ts:889`.
- The signature is `NotificationService.show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000, action?)`. The message comes first.
- Use Conventional Commits. Do not add AI attribution or `Co-Authored-By` lines.
- **Frontend tests:**
  - Single spec: `npx ng test --watch=false --include=<spec path>`.
  - Full suite: `npx ng test --watch=false`.
- **Backend tests:**
  - Single class: `./mvnw -q test -Dtest=<Class>`.
  - Full suite: `./mvnw -q test`.
- **Verification uses production** (`https://backend.daybeldiaz.dev/api`) with the user's personal account.
  - The credentials are supplied by the user at run time. Never write them to any file, commit or memory.
  - Every record created during a check is prefixed `[TEST]` and deleted in the same session.
  - Never edit or delete existing records.
- Merge order: `fix/functional-bugs` → `master` → `redesign/visual-identity`, before redesign Phase 6. Merging is the user's decision; do not push or merge without asking.

## Review Focus

1. **Expired or malformed token in `getUserId()`.** If the token is missing, malformed or has no `userId` claim, B1 must not send `PUT /users/update/undefined`. It must show an error toast and send no request. The test is in Task 6.
2. **Budget `spent` after B9.** A YEARLY budget must keep the API's year-to-date `spent`, and a MONTHLY budget must keep the API's value, even when the month's stats have no entry for that category. The test is in Task 7.
3. **Existing DAILY/WEEKLY budgets after C1.** They must still list, update their limit and delete. Only creating them, or changing a budget's period to DAILY/WEEKLY, is rejected. The test is in Task 8.
4. **Missing translation keys.** Every new key must resolve in both languages. A missing key renders as the raw key on screen. The test is in Task 3.
5. **Spanish users and the banks flow.** B5 must not leave any English-only text in the connect/disconnect error paths. The keys are covered by the same test in Task 3.

---

### Task 1: Branches

- [ ] **Step 1: Create the frontend branch.**
  In the frontend repo, run `git switch master && git pull --ff-only && git switch -c fix/functional-bugs`. Uncommitted docs from the redesign branch carry over untracked; do not commit them on this branch.
- [ ] **Step 2: Check the frontend baseline.**
  Run `npx ng test --watch=false`. Expected: `app.spec.ts` passes. Record any failure as a pre-existing failure.

The backend branch is created in Task 8.

### Task 2: B2 + B7 — Incomes toast arguments and table colspan

**Files:**
- Modify: `src/app/features/incomes/incomes.component.ts`, lines 582, 209 and 217.

- [ ] **Step 1: Fix B2.**
  At line 582, change `this.ns.show('error', err.error?.message || 'Operation failed')` to `this.ns.show(err.error?.message || 'notif.operation_failed', 'error')`. Add the key `'notif.operation_failed': { es: 'La operación falló', en: 'Operation failed' }` to the dictionary.
- [ ] **Step 2: Fix B7.**
  At lines 209 and 217, change `colspan="5"` to `colspan="4"`. The table has 4 `<th>` (lines 166–169).
- [ ] **Step 3: Run the manual check.**
  1. Run `npm start` and log in.
  2. Open Incomes with DevTools set to offline.
  3. Save a `[TEST]` income.
  4. Expected: a red toast reading "Operation failed", not "error".
  5. Go back online. Expected: the empty or padded rows span the full table width.
- [ ] **Step 4: Commit B2.**
  Commit the B2 change alone: `fix(incomes): pass toast message before type`. Put the manual check in the commit body.
- [ ] **Step 5: Commit B7.**
  Commit `fix(incomes): match placeholder colspan to table columns`.

### Task 3: Translation keys (B3, B5, B6) with a guard test

**Files:**
- Create: `src/app/core/services/translation.service.spec.ts`
- Modify: `src/app/core/services/translation.service.ts` (dictionary)
- Modify: `src/app/features/reminders/reminders.component.ts`, lines 64, 67 and 172
- Modify: `src/app/features/budgets/budgets.component.ts`, lines 791, 795, 805, 809, 836 and 838
- Modify: `src/app/features/banks/banks.component.ts`, lines 293, 298 and 327

**Interfaces:**
- Produces: the translation keys below, which later tasks and the redesign reuse.

| Key | es | en |
|---|---|---|
| `reminders.empty_title` | Aún no tienes recordatorios | No reminders yet |
| `reminders.empty_desc` | Crea un recordatorio para no olvidar ningún pago. | Create a reminder so you never miss a payment. |
| `reminders.new_title` | Nuevo Recordatorio | New Reminder |
| `budgets.updated` | Presupuesto actualizado | Budget updated successfully |
| `budgets.update_failed` | No se pudo actualizar el presupuesto | Failed to update budget |
| `budgets.created` | Presupuesto creado | Budget created successfully |
| `budgets.create_failed` | No se pudo crear el presupuesto | Failed to create budget |
| `budgets.deleted` | Presupuesto eliminado | Budget deleted |
| `budgets.delete_failed` | No se pudo eliminar el presupuesto | Failed to delete budget |
| `banks.unexpected_response` | Respuesta inesperada del servidor. | Unexpected response from server. |
| `banks.connect_failed` | No se pudo conectar el banco. Inténtalo de nuevo. | Failed to connect to bank. Please try again. |
| `banks.disconnect_failed` | No se pudo desconectar el banco. | Failed to disconnect bank. |

- [ ] **Step 1: Write the failing test.**
  In `translation.service.spec.ts`, add `describe('TranslationService keys')` with one `it` per language. Each one does `service.setLang('es')` (or `'en'`), then for every key in the table above (and `notif.operation_failed` from Task 2) asserts `expect(service.translate(key)).not.toBe(key)`.
- [ ] **Step 2: Watch it fail.**
  Run `npx ng test --watch=false --include=src/app/core/services/translation.service.spec.ts`. Expected: FAIL, listing the missing keys.
- [ ] **Step 3: Add the keys.**
  Add every key in the table to the dictionary.
- [ ] **Step 4: Watch it pass.**
  Run the same command. Expected: PASS.
- [ ] **Step 5: Fix B3 and commit.**
  In `reminders.component.ts`, replace `goals.empty_title` with `reminders.empty_title`, `goals.empty_desc` with `reminders.empty_desc`, and `goals.new_title` (line 172) with `reminders.new_title`.
  Commit `fix(reminders): use reminder copy instead of goals keys`, together with the spec file and the dictionary keys.
- [ ] **Step 6: Fix B6 and commit.**
  In `budgets.component.ts`, replace each hardcoded toast with its key. Keep `err.error?.message ||` in front of the failure keys.
  Commit `fix(budgets): translate budget toasts`.
- [ ] **Step 7: Fix B5 and commit.**
  In `banks.component.ts`, inject `NotificationService` as `ns` if it is not already injected. Replace each `alert(...)` with `this.ns.show('<key>', 'error')`, using the matching `banks.*` key.
  Commit `fix(banks): replace alert() with translated toasts`.

### Task 4: B8 — Remove debug logging

**Files:**
- Modify: all 19 calls, found with `grep -rn "console.log" src/app`. The counts are:
  - `auth.service.ts` (5)
  - `data-preload.service.ts` (3)
  - `update.service.ts` (3)
  - `login.component.ts` (3)
  - `expense-state.service.ts`, `income-state.service.ts`, `oauth-callback.component.ts`, `register.component.ts` and `banks.component.ts` (1 each)

- [ ] **Step 1: Delete the calls.**
  Delete every `console.log`. Do not convert them to `console.error`. Existing `console.error` calls in catch blocks stay.
- [ ] **Step 2: Verify.**
  Run `grep -rn "console.log" src/app`. Expected: no output.
  Run `npx ng build`. Expected: the build succeeds, with no new unused-variable errors from removed logs.
- [ ] **Step 3: Commit.**
  Commit `chore: remove debug console.log calls`.

### Task 5: B4 — Reminders delete confirmation modal

**Files:**
- Modify: `src/app/features/reminders/reminders.component.ts`, line 348 and the template.

- [ ] **Step 1: Replace `confirm()` with a modal.**
  Replace `confirm()` with a signal-driven delete modal:
  - Add `deleteTargetId = signal<number | null>(null)`.
  - `requestDelete(id: number)` sets it.
  - `confirmDelete()` deletes and clears it.
  - `cancelDelete()` clears it.
  - Copy the markup of the existing delete-confirm modal in `goals.component.ts` (`~:338-381`), using the keys `trans.delete_msg`, `common.cancel` and `common.delete`. If a key does not exist, use the key `goals.component.ts` uses for the same button.
  - This copy is temporary. Redesign Phase 6 replaces it with the shared `ui-confirm-dialog`.
- [ ] **Step 2: Run the manual check.**
  1. Create a `[TEST]` reminder.
  2. Click delete. Expected: the modal appears and no native dialog opens.
  3. Click Cancel. Expected: the reminder stays.
  4. Click delete, then Confirm. Expected: the reminder disappears.
- [ ] **Step 3: Commit.**
  Commit `fix(reminders): replace native confirm with delete modal`, with the manual check in the body.

### Task 6: B1 — Settings uses the real user id

**Files:**
- Create: `src/app/core/services/auth.service.spec.ts`
- Modify: `src/app/core/services/auth.service.ts`
- Modify: `src/app/features/settings/settings.component.ts`, lines 422–450

**Interfaces:**
- Produces: `AuthService.getUserId(): number | null`.
  - It decodes the payload of `localStorage['spendly_token']` (base64url) and returns the numeric `userId` claim.
  - It returns `null` when the token is missing, malformed or has no numeric `userId`.

- [ ] **Step 1: Write the failing tests.**
  In `auth.service.spec.ts`, build tokens as `header.payload.sig` with `btoa(JSON.stringify(payload))`, converted to base64url. Add these tests:
  - `getUserId returns the userId claim`: payload `{ userId: 42, exp: <now+3600> }` → `42`.
  - `getUserId returns null without a token` → `null`.
  - `getUserId returns null for a malformed token`: token `'abc'` → `null`.
  - `getUserId returns null when the claim is missing`: payload `{ exp: <now+3600> }` → `null`.
- [ ] **Step 2: Watch them fail.**
  Run `npx ng test --watch=false --include=src/app/core/services/auth.service.spec.ts`. Expected: FAIL, because `getUserId` is not a function.
- [ ] **Step 3: Implement `getUserId()`.**
  Reuse the decoding approach already in `isTokenExpired` (`:40-47`), and handle base64url by replacing `-` with `+` and `_` with `/`.
- [ ] **Step 4: Watch them pass.**
  Run the same command. Expected: PASS.
- [ ] **Step 5: Use it in Settings.**
  In `settings.component.ts`, replace both `const mockId = 1` with `const userId = this.authService.getUserId()`. Inject `AuthService` if it is not already injected. If `userId === null`, show `ns.show('settings.session_invalid', 'error')` and return without calling the API.
  Add the key `settings.session_invalid` = es `Tu sesión no es válida. Vuelve a iniciar sesión.` / en `Your session is invalid. Please sign in again.`. Also remove the commented `deleteUser(mockId)` lines (`:464-465`).
- [ ] **Step 6: Run the manual check.**
  1. In Settings → Profile, change the name to the same value and save.
  2. In DevTools → Network, the request is `PUT /users/update/<your id>`, not `/1`, and it returns 200.
  Do not change the password during this check.
- [ ] **Step 7: Commit.**
  Commit `fix(settings): update the authenticated user instead of id 1`.

### Task 7: B9 — Keep the API's budget `spent`

**Files:**
- Create: `src/app/core/services/budget-state.service.spec.ts`
- Modify: `src/app/core/services/budget-state.service.ts:41-52`

- [ ] **Step 1: Write the failing test.**
  `BudgetStateService keeps spent from the API`:
  - Provide a mock `ApiService` where `getMonthlyBudgets` returns `[{ id: 1, period: 'MONTHLY', spent: 300, limit: 1000, category: { id: 5, name: 'Food', color: '#000', icons: 'restaurant' } }]` and `getExpensesByCategory` returns `{ Food: 999 }`.
  - Read `service.filteredBudgets()` after loading, flushing with `await fixture.whenStable()` or the service's own load trigger.
  - Expect `spent` to be `300`.
  - Second case: stats `{}`, so `spent` stays `300` and not `0`.
- [ ] **Step 2: Watch it fail.**
  Run `npx ng test --watch=false --include=src/app/core/services/budget-state.service.spec.ts`. Expected: FAIL, with 999 and 0.
- [ ] **Step 3: Implement.**
  Remove the stats-based override. Keep `forkJoin` only if `stats` is still used elsewhere in the service; otherwise call `getMonthlyBudgets` alone.
- [ ] **Step 4: Watch it pass.**
  Run the same command. Expected: PASS.
- [ ] **Step 5: Run the manual check.**
  On the Budgets page, each card's spent matches the expenses of that category for the month.
- [ ] **Step 6: Commit.**
  Commit `fix(budgets): use spent calculated by the API per period`.

### Task 8: C1 backend — reject DAILY/WEEKLY budgets

**Repo:** `/home/daybeldiaz/code/spendly-api/Spendly-Api`

**Files:**
- Modify: `src/main/java/com/spendly/spendly/services/impl/BudgetServiceImpl.java`, in `create` (`:77`) and `update` (`:241`)
- Test: `src/test/java/com/spendly/spendly/services/BudgetServiceImplTest.java`

**Interfaces:**
- Produces: `BadRequestException("El período del presupuesto debe ser MONTHLY o YEARLY")` for DAILY/WEEKLY on create, and on update when `dto.period()` is non-null and is DAILY/WEEKLY.
- **Do NOT change the `Periods` enum.** `Recurring.frequency` uses it.

- [ ] **Step 1: Create the branch.**
  Run `git switch develop && git pull --ff-only && git switch -c fix/budget-periods`.
- [ ] **Step 2: Write the failing tests.**
  Follow the existing Mockito style of `BudgetServiceImplTest`:
  - `testCreateBudget_RejectsDaily` and `testCreateBudget_RejectsWeekly`: `assertThrows(BadRequestException.class, ...)` and `verify(budgetRepository, never()).save(any())`.
  - `testUpdateBudget_RejectsWeeklyPeriod`: same assertions.
  - `testUpdateBudget_AllowsLimitChangeOnLegacyWeeklyBudget`: an existing WEEKLY budget, `dto.period() == null`, new limit → succeeds and saves.
  - `testCreateBudget_AcceptsYearly`: succeeds.
- [ ] **Step 3: Watch them fail.**
  Run `./mvnw -q test -Dtest=BudgetServiceImplTest`. Expected: the reject tests FAIL.
- [ ] **Step 4: Implement.**
  Add `private void assertAllowedBudgetPeriod(Periods period)`. Call it at the start of `create`, and in `update` when `dto.period() != null`.
- [ ] **Step 5: Watch them pass.**
  Run `./mvnw -q test -Dtest=BudgetServiceImplTest`, then `./mvnw -q test`. Expected: all PASS.
- [ ] **Step 6: Commit.**
  Commit `feat(budgets): restrict budget periods to monthly and yearly`, with this body: `BREAKING CHANGE: creating or switching a budget to DAILY or WEEKLY now returns 400.`

### Task 9: C1 frontend — Monthly/Yearly choice in the budget form

**Files:**
- Modify: `src/app/core/models/api.models.ts:200-233`
- Modify: `src/app/features/budgets/budgets.component.ts`, including the form at `:595` and the dead `periods` array at `:577`

**Interfaces:**
- Produces: `export type BudgetInputPeriod = 'MONTHLY' | 'YEARLY';`. `CreateBudgetDto.period` and `UpdateBudgetDto.period` use it. `Budget.period` keeps `BudgetPeriod`, because legacy rows can still be DAILY/WEEKLY.

- [ ] **Step 1: Narrow the DTO types.**
  Add `BudgetInputPeriod` and use it in both DTOs. Run `npx ng build` and fix the resulting type errors in `budgets.component.ts` and `budget-state.service.ts`.
- [ ] **Step 2: Replace the dead array.**
  Replace `periods = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']` with `periods: BudgetInputPeriod[] = ['MONTHLY', 'YEARLY']`.
- [ ] **Step 3: Add the control to the form.**
  Add a two-option segmented control bound to the `period` control (default `'MONTHLY'`), styled like the existing toggle in the same modal so this branch adds no new visual language.
  Add the keys `budgets.period_monthly` (Mensual / Monthly) and `budgets.period_yearly` (Anual / Yearly) to the dictionary and to the Task 3 spec list.
  When editing a legacy DAILY/WEEKLY budget, show the period as read-only text and do not send `period` in the update.
- [ ] **Step 4: Run the manual check.**
  This runs against production, whose backend may not have Task 8 deployed yet. Check only that:
  1. A `[TEST]` yearly budget is created.
  2. The card shows the yearly period.
  3. Its spent reflects year-to-date spending, which needs B9.
  Delete it afterwards.
- [ ] **Step 5: Commit.**
  Commit `feat(budgets): let users choose monthly or yearly budgets`.

### Task 10: Final verification

- [ ] **Step 1: Run the full suites.**
  Run `npx ng test --watch=false && npx ng build` in the frontend and `./mvnw -q test` in the backend. Expected: all green.
- [ ] **Step 2: Clean up.**
  Confirm that no `[TEST]` records are left in production and that the real budgets for the month show the same `spent` as before the session.
- [ ] **Step 3: Review.**
  Run one fresh reviewer over `git diff master...fix/functional-bugs` and `git diff develop...fix/budget-periods` against the spec. Fix only real findings.
- [ ] **Step 4: Report.**
  Report to the user: the commits per branch, the test output, the manual checks done and anything skipped. Pushing and merging are the user's decision.
