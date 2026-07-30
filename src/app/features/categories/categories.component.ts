import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CategoryIconPipe } from '../../shared/icons/category-icon.pipe';
import { UiCardComponent } from '../../shared/components/ui/ui-card.component';
import { UiStatComponent } from '../../shared/components/ui/ui-stat.component';
import { UiSectionHeaderComponent } from '../../shared/components/ui/ui-section-header.component';
import { UiEmptyStateComponent } from '../../shared/components/ui/ui-empty-state.component';
import { CHART_PALETTE } from '../../shared/charts/chart-theme';
import { catchError, of } from 'rxjs';

interface CategoryRow {
  name: string;
  amount: number;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    CategoryIconPipe,
    UiCardComponent,
    UiStatComponent,
    UiSectionHeaderComponent,
    UiEmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <p class="eyebrow mb-1">{{ ts.t()('nav.expenses') }}</p>
          <h1 class="font-display text-3xl md:text-4xl font-semibold tracking-tight text-content">
            {{ ts.t()('nav.categories') }}
          </h1>
        </div>

        <!-- Month Selector -->
        <div
          class="flex items-center justify-between w-full md:w-auto bg-surface-2 rounded-xl p-1 shadow-sm border border-divider"
        >
          <button
            (click)="prevMonth()"
            class="p-2 hover:bg-surface-3 rounded-lg text-content-muted transition-colors"
          >
            <app-icon name="chevron_left" [size]="22" />
          </button>
          <span class="px-3 font-semibold text-content text-center min-w-[8rem] capitalize">
            {{ currentDate() | date : 'MMMM yyyy' }}
          </span>
          <button
            (click)="nextMonth()"
            [disabled]="isCurrentMonth()"
            [class.opacity-40]="isCurrentMonth()"
            [class.cursor-not-allowed]="isCurrentMonth()"
            class="p-2 hover:bg-surface-3 rounded-lg text-content-muted transition-colors"
          >
            <app-icon name="chevron_right" [size]="22" />
          </button>
        </div>
      </div>

      <!-- Total -->
      <ui-card>
        <ui-stat
          [label]="ts.currentLang() === 'es' ? 'Total gastado' : 'Total spent'"
          [value]="total() | currency : 'DOP' : 'symbol' : '1.2-2'"
          tone="expense"
          icon="pie_chart"
        />
      </ui-card>

      <!-- Breakdown list -->
      <ui-card>
        <ui-section-header
          [title]="ts.currentLang() === 'es' ? 'Gastos por categoría' : 'Spending by category'"
          [subtitle]="
            rows().length
              ? (ts.currentLang() === 'es'
                  ? rows().length + ' categorías este mes'
                  : rows().length + ' categories this month')
              : ''
          "
          class="mb-6 block"
        />

        @if (isLoading()) {
        <div class="space-y-5 animate-pulse">
          @for (i of [1, 2, 3, 4, 5]; track i) {
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-surface-3 shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-1/3 bg-surface-3 rounded"></div>
              <div class="h-1.5 w-full bg-surface-3 rounded-full"></div>
            </div>
          </div>
          }
        </div>
        } @else if (rows().length === 0) {
        <ui-empty-state
          icon="pie_chart"
          [title]="ts.currentLang() === 'es' ? 'Sin gastos' : 'No expenses'"
          [description]="
            ts.currentLang() === 'es'
              ? 'No hay gastos registrados en este mes.'
              : 'No expenses recorded for this month.'
          "
        />
        } @else {
        <div class="space-y-5">
          @for (cat of rows(); track cat.name; let i = $index) {
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              [style.background-color]="catColor(i) + '22'"
              [style.color]="catColor(i)"
            >
              <app-icon [name]="cat.name | categoryIcon" [size]="20" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-3">
                <span class="truncate text-sm font-medium text-content">{{
                  ts.translateCategory(cat.name)
                }}</span>
                <span class="shrink-0 font-display text-sm font-semibold tabular text-content">
                  {{ cat.amount | currency : 'DOP' : 'symbol' : '1.2-2' }}
                </span>
              </div>
              <div class="mt-1.5 flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    class="h-full rounded-full transition-[width] duration-700 ease-out"
                    [style.width.%]="percent(cat.amount)"
                    [style.background-color]="catColor(i)"
                  ></div>
                </div>
                <span class="w-9 shrink-0 text-right text-xs tabular text-content-muted">
                  {{ round(percent(cat.amount)) }}%
                </span>
              </div>
            </div>
          </div>
          }
        </div>
        }
      </ui-card>
    </div>
  `,
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  ts = inject(TranslationService);

  currentDate = signal(new Date());
  isLoading = signal(false);
  rows = signal<CategoryRow[]>([]);

  total = computed(() => this.rows().reduce((s, r) => s + r.amount, 0));

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const d = this.currentDate();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    this.isLoading.set(true);

    this.api
      .getExpensesByCategory(year, month)
      .pipe(catchError(() => of({} as Record<string, number>)))
      .subscribe((stats) => {
        const rows = Object.entries(stats || {})
          .map(([name, amount]) => ({ name, amount: Number(amount) || 0 }))
          .filter((r) => r.amount > 0)
          .sort((a, b) => b.amount - a.amount);
        this.rows.set(rows);
        this.isLoading.set(false);
      });
  }

  percent(amount: number): number {
    const total = this.total();
    return total > 0 ? (amount / total) * 100 : 0;
  }

  round(n: number): number {
    return Math.round(n);
  }

  catColor(index: number): string {
    return CHART_PALETTE[index % CHART_PALETTE.length];
  }

  prevMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
    this.loadData();
  }

  nextMonth() {
    if (this.isCurrentMonth()) return;
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
    this.loadData();
  }

  isCurrentMonth(): boolean {
    const now = new Date();
    const c = this.currentDate();
    return now.getMonth() === c.getMonth() && now.getFullYear() === c.getFullYear();
  }
}
