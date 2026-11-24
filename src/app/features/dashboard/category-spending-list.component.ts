import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategorySpendingRow } from '../../core/utils/category-spending';
import { TranslationService } from '../../core/services/translation.service';
import {
  AmountComponent,
  ProgressBarComponent,
} from '../../shared/ui/atoms';
import {
  CategoryBadgeComponent,
  ListRowComponent,
  EmptyStateComponent,
} from '../../shared/ui/molecules';

@Component({
  selector: 'app-category-spending-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AmountComponent,
    ProgressBarComponent,
    CategoryBadgeComponent,
    ListRowComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      @if (rows().length > 0) {
        <div class="space-y-2">
          @for (row of rows(); track row.categoryName) {
            <ui-list-row
              [interactive]="true"
              (rowClick)="rowSelected.emit(row)"
              class="transition-transform active:scale-[0.99]"
            >
              <!-- Category Badge / Icon -->
              <ui-category-badge
                uiRowLeading
                [name]="ts.translateCategory(row.categoryName)"
                [color]="row.color"
                [icon]="row.icon"
                size="sm"
              />

              <!-- Title & Category Name -->
              <div class="min-w-0 pr-2">
                <p class="text-sm font-semibold text-ink truncate leading-tight">
                  {{ ts.translateCategory(row.categoryName) }}
                </p>
                <p class="text-xs text-ink-muted mt-0.5 truncate select-none">
                  {{ subText(row) }}
                </p>
              </div>

              <!-- Amount Spent -->
              <ui-amount
                uiRowTrailing
                [value]="row.spent"
                type="expense"
                size="md"
              />

              <!-- Progress Bar -->
              <div uiRowBelow class="pt-1">
                @if (row.budget) {
                  <ui-progress-bar
                    [percent]="row.budget.percent"
                    [status]="row.budget.status"
                    [label]="subText(row)"
                    thickness="regular"
                  />
                } @else {
                  <ui-progress-bar
                    [percent]="row.shareOfTotal"
                    status="neutral"
                    [label]="subText(row)"
                    thickness="thin"
                  />
                }
              </div>
            </ui-list-row>
          }
        </div>

        <!-- Discreet hint when user has no configured budgets -->
        @if (!hasAnyBudget()) {
          <div class="p-3.5 rounded-xl bg-surface-raised border border-border text-center text-xs text-ink-muted mt-3">
            <a
              routerLink="/budgets"
              class="hover:text-accent font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>{{ ts.t()('dashboard.no_budgets_hint') }}</span>
              <span class="material-icons-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        }
      } @else {
        <!-- Empty State for Months with Zero Spending -->
        <ui-empty-state
          icon="receipt_long"
          [title]="ts.t()('dashboard.no_expenses_title')"
          description="No se registraron gastos para este período."
        />
      }
    </div>
  `,
})
export class CategorySpendingListComponent {
  ts = inject(TranslationService);

  rows = input.required<CategorySpendingRow[]>();
  monthTotal = input<number>(0);
  locale = input<string>('es-DO');
  hasAnyBudget = input<boolean>(true);

  rowSelected = output<CategorySpendingRow>();

  formatLimit(amount: number): string {
    return 'RD$ ' + Math.round(amount).toLocaleString('en-US');
  }

  subText(row: CategorySpendingRow): string {
    if (row.budget) {
      const formatted = this.formatLimit(row.budget.limit);
      if (row.budget.scope === 'year') {
        return this.ts.t()('dashboard.cat_of_limit_year', { amount: formatted });
      }
      return this.ts.t()('dashboard.cat_of_limit', { amount: formatted });
    }
    return this.ts.t()('dashboard.cat_share', { pct: row.shareOfTotal });
  }
}
