# Spendly Functional Bug Fixes — Short Design

- **Date:** 2026-11-24
- **Branch:** `fix/functional-bugs`, from `master`. It is merged into `master` first and then into `redesign/visual-identity`.
- **Status:** draft, pending user approval.

## Intent

Fix functional bugs found during the frontend audit. They are kept separate from the visual redesign so that each change can be reviewed and reverted on its own.

- **Non-goals:** any visual change; refactors beyond what each fix needs.
- **Anti-goal:** a fix that changes the look or rewrites the screen around it.

## Approach

There is one sensible way to do this: one commit per bug, each with a test that reproduces the bug first (RED) and then passes (GREEN). The fix is the smallest change that makes the test pass.

When a bug can only be verified in the UI, the commit message records the manual browser check instead of a test.

## Bugs (verified in source on 2026-11-24)

| # | Where | Bug | Fix |
|---|---|---|---|
| B1 | `features/settings/settings.component.ts:422,445` | `updateUser` always sends `mockId = 1`, so profile and password updates target user 1. | Use the authenticated user's id. **Resolved (2026-11-24):** the access token carries a `userId` claim (backend `JwtService.java:49`). `AuthService` decodes it from `spendly_token`. |
| B2 | `features/incomes/incomes.component.ts:582` | `ns.show('error', message)` has its arguments swapped, so the toast shows the literal text "error". | Change it to `ns.show(message, 'error')`. |
| B3 | `features/reminders/reminders.component.ts:64,67,172` | The empty state and the "new" modal title use `goals.*` translation keys. | Add `reminders.*` keys in EN/ES and use them. |
| B4 | `features/reminders/reminders.component.ts:348` | Delete uses the native `confirm()`. | Use the app's confirm modal pattern. When the shared `confirm-dialog` from the redesign exists, switch to it. |
| B5 | `features/banks/banks.component.ts:293,298,327` | Errors are shown with `alert()`, in hardcoded English. | Use `NotificationService` with i18n keys. |
| B6 | `features/budgets/budgets.component.ts` (toasts near :791, :805, :836) | Toasts are hardcoded in English. | Move them to i18n keys. |
| B7 | `features/incomes/incomes.component.ts:~209` | `colspan="5"` on a 4-column table. | Change it to `colspan="4"`. |
| B8 | 19 `console.log` calls across the app (login, banks, auth.service, others) | Debug logging ships to production. | Remove them, or keep only `console.error` in error paths. |

| B9 | `core/services/budget-state.service.ts:47-51` | The frontend replaces each budget's `spent` with the month's category total from stats, whatever the budget's period is. A yearly budget therefore shows only one month of spending. The backend already calculates `spent` per period (`BudgetSpentService.calculateTotalSpentOptimized`). | Use the API's `spent`. |

## Product change C1: budgets limited to MONTHLY and YEARLY

This was requested by the user on 2026-11-24. It spans both repositories.

- **Backend** (`/home/daybeldiaz/code/spendly-api/Spendly-Api`, branch from `develop`):
  - Reject `DAILY` and `WEEKLY` in `CreateBudgetDto` and `UpdateBudgetDto` with a validation error.
  - **Do not remove values from the `Periods` enum.** It is shared with `Recurring.frequency`, which still needs `DAILY` and `WEEKLY`.
  - Add tests for the rejected and accepted periods.
- **Frontend:**
  - Add a Monthly/Yearly choice to the budget form. Today the form always sends `MONTHLY`, and its `periods` array (`budgets.component.ts:577`) is dead code.
  - Narrow `BudgetPeriod` for budget input to `'MONTHLY' | 'YEARLY'`.
- **Existing data** (my call, can be overridden):
  - Existing `DAILY` or `WEEKLY` budgets are not migrated or deleted. They stay readable and deletable.
  - Only creating new ones, or changing a budget to those periods, is blocked.
  - The UI can only create `MONTHLY` budgets today, so such rows can only exist through direct API calls.
- **Risk:** item 3 (contract change). Clients that create `DAILY` or `WEEKLY` budgets through the API stop working.

## Order

1. B2, B7, B3, B6, B5, B8. These are mechanical and independent of each other.
2. B4, which depends on the confirm-modal choice.
3. B1, B9, then C1. B1 is no longer blocked.

## Left to the builder

- The exact names of the new i18n keys.
- Whether B8 keeps `console.error` in catch blocks.
