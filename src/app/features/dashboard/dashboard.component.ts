import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  effect,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { PagedResponse } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { UiCardComponent } from '../../shared/components/ui/ui-card.component';
import { UiStatComponent } from '../../shared/components/ui/ui-stat.component';
import { UiSectionHeaderComponent } from '../../shared/components/ui/ui-section-header.component';
import { UiButtonComponent } from '../../shared/components/ui/ui-button.component';
import {
  CHART_PALETTE,
  CHART_PALETTE_HOVER,
  CHART_ANIMATION,
  CHART_ANIMATION_RADIAL,
  chartAxisColor,
  chartGridColor,
  chartIncomeColor,
  chartExpenseColor,
} from '../../shared/charts/chart-theme';
import { forkJoin, of, interval, Subscription, EMPTY, Observable } from 'rxjs';
import { catchError, expand, reduce, map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    BaseChartDirective,
    DatePipe,
    CurrencyPipe,
    IconComponent,
    UiCardComponent,
    UiStatComponent,
    UiSectionHeaderComponent,
    UiButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 transition-opacity duration-300" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row justify-between md:items-center gap-4 animate-fade-in-up"
      >
        <div>
          <p class="eyebrow mb-1">{{ ts.t()('dash.welcome') }}, {{ authService.currentUserStr() }}</p>
          <h1 class="font-display text-3xl md:text-4xl font-semibold tracking-tight text-content">
            {{ ts.t()('dash.title') }}
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

          <button
            (click)="openDatePicker()"
            class="px-2 font-semibold text-content flex-1 md:flex-none md:w-40 text-center whitespace-nowrap hover:bg-surface-3 py-1.5 rounded-lg cursor-pointer transition-colors capitalize"
          >
            {{ currentDate() | date : 'MMMM yyyy' }}
          </button>

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

      <!-- Month Picker Modal -->
      @defer (when showDatePicker()) {
      @if (showDatePicker()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/50 backdrop-blur-sm animate-fade-in"
        (click)="closeDatePicker()"
      >
        <div
          class="bg-surface-2 rounded-2xl shadow-2xl border border-divider p-6 w-full max-w-sm animate-scale-in"
          (click)="$event.stopPropagation()"
        >
          <!-- Year Selector -->
          <div class="flex items-center justify-between mb-6">
            <button
              (click)="changeYear(-1)"
              class="p-2 hover:bg-surface-3 rounded-full text-content-muted transition-colors"
            >
              <app-icon name="chevron_left" [size]="22" />
            </button>
            <span class="font-display text-xl font-semibold text-content tabular">
              {{ tempDate().getFullYear() }}
            </span>
            <button
              (click)="changeYear(1)"
              class="p-2 hover:bg-surface-3 rounded-full text-content-muted transition-colors"
            >
              <app-icon name="chevron_right" [size]="22" />
            </button>
          </div>

          <!-- Months Grid -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            @for (month of months; track $index; let i = $index) {
            <button
              (click)="selectMonth(i)"
              [disabled]="isFutureMonth(i)"
              class="p-3 rounded-xl text-sm font-medium transition-all capitalize"
              [class.bg-primary]="isSelectedMonth(i)"
              [class.text-primary-on]="isSelectedMonth(i)"
              [class.shadow-sm]="isSelectedMonth(i)"
              [class.bg-surface-3]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.text-content]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.hover:bg-primary]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.hover:text-primary-on]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.opacity-30]="isFutureMonth(i)"
              [class.cursor-not-allowed]="isFutureMonth(i)"
            >
              {{ month }}
            </button>
            }
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <ui-button variant="ghost" [block]="true" (click)="closeDatePicker()">
              {{ ts.t()('action.cancel') }}
            </ui-button>
            <ui-button [block]="true" (click)="confirmDateSelection()">
              {{ ts.t()('action.save') }}
            </ui-button>
          </div>
        </div>
      </div>
      }
      }

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up delay-100">
        <ui-card>
          <ui-stat
            [label]="ts.t()('dash.balance')"
            [value]="totalBalance() | currency : 'DOP' : 'symbol' : '1.2-2'"
            [tone]="totalBalance() < 0 ? 'expense' : 'ink'"
            icon="account_balance_wallet"
          />
        </ui-card>

        <ui-card>
          <ui-stat
            [label]="ts.t()('dash.income')"
            [value]="totalIncome() | currency : 'DOP' : 'symbol' : '1.2-2'"
            tone="success"
            icon="arrow_circle_up"
          />
        </ui-card>

        <ui-card>
          <ui-stat
            [label]="ts.t()('dash.expenses')"
            [value]="totalExpense() | currency : 'DOP' : 'symbol' : '1.2-2'"
            tone="expense"
            icon="arrow_circle_down"
          />
        </ui-card>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up delay-200">
        <!-- Expense Breakdown -->
        <ui-card>
          <ui-section-header [title]="ts.t()('dash.breakdown')" class="mb-6 block" />
          <div class="h-64 flex items-center justify-center">
            @defer (on viewport) {
            <canvas
              baseChart
              [data]="doughnutChartData"
              [type]="'doughnut'"
              [options]="doughnutChartOptions"
            >
            </canvas>
            } @placeholder {
            <div class="w-full h-full flex items-center justify-center animate-pulse">
              <div class="w-40 h-40 rounded-full border-8 border-surface-3"></div>
            </div>
            }
          </div>
        </ui-card>

        <!-- Income vs Expense -->
        <ui-card>
          <ui-section-header [title]="ts.t()('dash.overview')" class="mb-6 block" />
          <div class="h-64">
            @defer (on viewport) {
            <canvas baseChart [data]="barChartData" [type]="'bar'" [options]="barChartOptions">
            </canvas>
            } @placeholder {
            <div class="w-full h-full flex items-end gap-4 animate-pulse px-4">
               <div class="w-1/6 h-[40%] bg-surface-3 rounded-t"></div>
               <div class="w-1/6 h-[70%] bg-surface-3 rounded-t"></div>
               <div class="w-1/6 h-[50%] bg-surface-3 rounded-t"></div>
               <div class="w-1/6 h-[80%] bg-surface-3 rounded-t"></div>
               <div class="w-1/6 h-[60%] bg-surface-3 rounded-t"></div>
               <div class="w-1/6 h-[90%] bg-surface-3 rounded-t"></div>
            </div>
            }
          </div>
        </ui-card>
      </div>
    </div>
  `,
  styles: [
    `
      .delay-100 {
        animation-delay: 100ms;
      }
      .delay-200 {
        animation-delay: 200ms;
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);
      }
      @keyframes fadeInUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentDate = signal(new Date());

  private refreshSubscription: Subscription | null = null;

  // Date Picker State
  showDatePicker = signal(false);
  tempDate = signal(new Date());
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  isLoading = signal(false);

  totalBalance = signal(0);
  totalIncome = signal(0);
  totalExpense = signal(0);

  // Charts Config — colors come from design tokens (see shared/charts/chart-theme)
  // and are refreshed on theme changes by the effect() in the constructor.
  doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: CHART_PALETTE,
        hoverBackgroundColor: CHART_PALETTE_HOVER,
        borderWidth: 0,
      },
    ],
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: CHART_ANIMATION_RADIAL,
    plugins: {
      legend: { position: 'right', labels: { color: chartAxisColor() } },
    },
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Income',
        backgroundColor: chartIncomeColor(),
        borderRadius: 4,
      },
      {
        data: [],
        label: 'Expense',
        backgroundColor: chartExpenseColor(),
        borderRadius: 4,
      },
    ],
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: CHART_ANIMATION,
    scales: {
      x: { grid: { color: chartGridColor() }, ticks: { color: chartAxisColor() } },
      y: { grid: { color: chartGridColor() }, ticks: { color: chartAxisColor() } },
    },
    plugins: {
      legend: { labels: { color: chartAxisColor() } },
    },
  };

  // Cache for translation updates
  private lastIncomes: any[] = [];
  private lastExpenses: any[] = [];
  private lastCategoryStats: any = {};

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    public ts: TranslationService,
    private theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    // React to language AND theme changes to update chart labels/colors
    effect(() => {
      const lang = this.ts.currentLang(); // dependency
      this.theme.darkMode(); // dependency — re-theme charts on toggle

      // Refresh token-driven colors (axis/grid/series) for the new theme
      this.applyChartTheme();

      // Update Bar Chart Labels
      this.prepareHistoryChart(this.lastIncomes, this.lastExpenses);

      // Update Doughnut Chart (Categories)
      this.updateDoughnutChart();

      this.cdr.markForCheck();
    });
  }

  /** Re-read design tokens and apply them to the (theme-aware) chart options. */
  private applyChartTheme() {
    const axis = chartAxisColor();
    const grid = chartGridColor();
    this.doughnutChartOptions = {
      ...this.doughnutChartOptions,
      animation: CHART_ANIMATION_RADIAL,
      plugins: { legend: { position: 'right', labels: { color: axis } } },
    };
    this.barChartOptions = {
      ...this.barChartOptions,
      animation: CHART_ANIMATION,
      scales: {
        x: { grid: { color: grid }, ticks: { color: axis } },
        y: { grid: { color: grid }, ticks: { color: axis } },
      },
      plugins: { legend: { labels: { color: axis } } },
    };
  }

  updateDoughnutChart() {
    if (!this.lastCategoryStats) return;

    const keys = Object.keys(this.lastCategoryStats);
    const translatedLabels = keys.map((k) => this.ts.translateCategory(k));

    this.doughnutChartData = {
      labels: translatedLabels,
      datasets: [
        {
          data: Object.values(this.lastCategoryStats),
          backgroundColor: CHART_PALETTE,
          hoverBackgroundColor: CHART_PALETTE_HOVER,
          borderWidth: 0,
        },
      ],
    };
  }

  ngOnInit() {
    this.loadData();

    // Poll every 30 seconds to update data (check for automatic expenses)
    // Cache is 2 mins, so this ensures we see updates reasonably fast after cache expires
    this.refreshSubscription = interval(30000).subscribe(() => {
      // Only refresh if we are holding the current view (or whatever logic)
      // We reload whatever is currently selected.
      this.loadData(true);
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadData(isBackground: boolean = false) {
    const targetDate = this.currentDate();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    if (!isBackground) {
      this.isLoading.set(true);
      this.apiService.clearCache('expenses');
      this.apiService.clearCache('incomes');
      this.apiService.clearCache('dashboard');
    }

    // 1. FAST PATH: Quick Stats (Expense Total, Category Breakdown)
    this.loadQuickStats(year, month);

    // 2. SLOW PATH: Full History for Charts & Income Total
    this.loadHistoricalData(year, month);
  }

  loadQuickStats(year: number, month: number) {
    forkJoin({
      expenseTotal: this.apiService
        .getExpensesMonthTotal(year, month)
        .pipe(catchError(() => of({ total: 0 }))),
      categoryStats: this.apiService
        .getExpensesByCategory(year, month)
        .pipe(catchError(() => of({}))),
      incomePage: this.apiService
        .getIncomes(0, 100)
        .pipe(catchError(() => of({ content: [] } as any))),
    }).subscribe({
      next: ({ expenseTotal, categoryStats, incomePage }) => {
        // Update Expense Card immediately
        this.totalExpense.set(expenseTotal.total || 0);

        // Update Income Card immediately (Approximation or Exact if <100)
        const currentMonthIncomes = incomePage.content
          ? incomePage.content.filter((i: any) => {
              const [y, m] = i.date.toString().split('-');
              return parseInt(m, 10) === month && parseInt(y, 10) === year;
            })
          : [];
        const incomeTotal = currentMonthIncomes.reduce(
          (acc: number, curr: any) => acc + curr.amount,
          0
        );
        this.totalIncome.set(incomeTotal);

        this.updateBalance();

        // Store raw stats for re-translation
        this.lastCategoryStats = categoryStats;
        this.updateDoughnutChart();

        // We do NOT set isLoading=false here, we wait for full history
        // But the user sees numbers!
      },
    });
  }

  loadHistoricalData(year: number, month: number) {
    forkJoin({
      incomes: this.fetchAllHistory((p, s) => this.apiService.getIncomes(p, s)).pipe(
        catchError(() => of([]))
      ),
      expenses: this.fetchAllHistory((p, s) => this.apiService.getExpenses(p, s)).pipe(
        catchError(() => of([]))
      ),
    }).subscribe({
      next: ({ incomes, expenses }) => {
        this.isLoading.set(false);

        // A. Update Income Total (Must calc from history as we lack endpoint)
        const currentMonthIncomes = incomes
          ? incomes.filter((i: any) => {
              const [y, m] = i.date.toString().split('-');
              return parseInt(m, 10) === month && parseInt(y, 10) === year;
            })
          : [];
        const incomeTotal = currentMonthIncomes.reduce(
          (acc: number, curr: any) => acc + curr.amount,
          0
        );
        this.totalIncome.set(incomeTotal);

        // Update Balance with finalized numbers
        this.updateBalance();

        // B. Prepare Charts
        this.lastIncomes = incomes;
        this.lastExpenses = expenses;
        this.prepareHistoryChart(incomes, expenses);

        // Note: We don't overwrite totalExpense here; we trust the Fast Path.
        // Unless we find a discrepancy logic, but API total is usually truth.
      },
      error: () => this.isLoading.set(false),
    });
  }

  private fetchAllHistory<T extends { date: string }>(
    fetchFn: (page: number, size: number) => Observable<PagedResponse<T>>
  ): Observable<T[]> {
    const today = new Date();
    const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1); // 11 months back + current = 12 months window

    return fetchFn(0, 100).pipe(
      expand((res: PagedResponse<T>) => {
        const content = res.content || [];
        // Stop if empty or last page
        if (content.length === 0 || res.page.number >= res.page.totalPages - 1) {
          return EMPTY;
        }

        // Stop if the last item is already older than our window
        const lastItem = content[content.length - 1];
        const lastDate = new Date(lastItem.date);

        // Note: API validation might be needed if dates aren't perfectly sorted,
        // but assuming desc sort from API:
        if (lastDate < twelveMonthsAgo) {
          return EMPTY;
        }

        return fetchFn(res.page.number + 1, 100);
      }),
      reduce((acc, res) => acc.concat(res.content || []), [] as T[])
    );
  }

  prepareHistoryChart(incomes: any[], expenses: any[]) {
    // 1. Generate last 12 month labels
    const months: string[] = [];
    const incomeData: number[] = new Array(12).fill(0);
    const expenseData: number[] = new Array(12).fill(0);

    const today = this.currentDate();

    // Loop from 11 down to 0 (12 months total)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString(this.ts.currentLang() === 'es' ? 'es-ES' : 'en-US', {
        month: 'short',
      });
      months.push(monthName);

      // Filter and sum for this specific month/year
      const yearToCheck = d.getFullYear();
      const monthToCheck = d.getMonth(); // 0-indexed

      const monthIncome = incomes
        .filter((t) => {
          // Parse YYYY-MM-DD directly
          const [y, m] = t.date.toString().split('-');
          // m is 1-indexed string ('01'...'12'), monthToCheck is 0-indexed number
          return parseInt(m, 10) === monthToCheck + 1 && parseInt(y, 10) === yearToCheck;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpense = expenses
        .filter((t) => {
          // Parse YYYY-MM-DD directly
          const [y, m] = t.date.toString().split('-');
          // m is 1-indexed string ('01'...'12'), monthToCheck is 0-indexed number
          return parseInt(m, 10) === monthToCheck + 1 && parseInt(y, 10) === yearToCheck;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Map to array index (11 - i)
      // i=11 (oldest) -> index 0
      // i=0 (current) -> index 11
      const index = 11 - i;
      incomeData[index] = monthIncome;
      expenseData[index] = monthExpense;
    }

    const newBarData = {
      labels: months,
      datasets: [
        {
          data: incomeData,
          label: this.ts.t()('dash.income'),
          backgroundColor: chartIncomeColor(),
          borderRadius: 4,
        },
        {
          data: expenseData,
          label: this.ts.t()('dash.expenses'),
          backgroundColor: chartExpenseColor(),
          borderRadius: 4,
        },
      ],
    };

    if (JSON.stringify(this.barChartData) !== JSON.stringify(newBarData)) {
      this.barChartData = newBarData;
    }
  }

  updateBalance() {
    this.totalBalance.set(this.totalIncome() - this.totalExpense());
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
    const today = new Date();
    const current = this.currentDate();
    return today.getMonth() === current.getMonth() && today.getFullYear() === current.getFullYear();
  }

  // Date Picker Methods
  openDatePicker() {
    // Clone date and set to 1st of month to avoid rollover issues
    // e.g. If current is Jan 31, setting month to Feb (1) would roll to Mar 3
    const d = new Date(this.currentDate());
    d.setDate(1);
    this.tempDate.set(d);
    this.showDatePicker.set(true);
  }

  closeDatePicker() {
    this.showDatePicker.set(false);
  }

  changeYear(delta: number) {
    const d = new Date(this.tempDate());
    d.setFullYear(d.getFullYear() + delta);
    this.tempDate.set(d);
  }

  selectMonth(monthIndex: number) {
    const d = new Date(this.tempDate());
    d.setMonth(monthIndex);
    this.tempDate.set(d);
  }

  isSelectedMonth(monthIndex: number): boolean {
    return this.tempDate().getMonth() === monthIndex;
  }

  isFutureMonth(monthIndex: number): boolean {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const selectedYear = this.tempDate().getFullYear();

    if (selectedYear > currentYear) return true;
    if (selectedYear === currentYear && monthIndex > currentMonth) return true;
    return false;
  }

  confirmDateSelection() {
    this.currentDate.set(new Date(this.tempDate()));
    this.loadData();
    this.closeDatePicker();
  }
}
