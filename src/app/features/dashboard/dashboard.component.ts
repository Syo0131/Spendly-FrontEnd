import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { PagedResponse, Budget, Category, MonthlyStats } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { ThemeService } from '../../core/services/theme.service';
import { AmountComponent } from '../../shared/ui/atoms';
import { MonthSelectorComponent } from '../../shared/ui/molecules';
import { CategorySpendingListComponent } from './category-spending-list.component';
import { CategorySpendingRow, buildCategorySpendingRows } from '../../core/utils/category-spending';
import { readToken } from '../../shared/ui/tokens/read-token';
import { forkJoin, of, interval, Subscription, EMPTY, Observable } from 'rxjs';
import { catchError, expand, reduce, map, finalize } from 'rxjs/operators';
import { lastTwelveMonths } from '../../core/utils/month';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BaseChartDirective,
    AmountComponent,
    MonthSelectorComponent,
    CategorySpendingListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="space-y-6 transition-opacity duration-300"
      [class.opacity-60]="isLoading()"
    >
      <!-- Page Header & Month Selector -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold font-heading text-ink tracking-tight">
            {{ ts.t()('dash.title') }}
          </h1>
          <p class="text-sm text-ink-muted mt-0.5">
            {{ ts.t()('dash.welcome') }}, {{ authService.currentUserStr() }}
          </p>
        </div>

        <ui-month-selector
          [value]="currentDate()"
          (valueChange)="onMonthChange($event)"
        />
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Balance Total -->
        <div class="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-sm">
          <div class="flex items-center justify-between text-ink-muted">
            <span class="text-xs font-semibold uppercase tracking-wider">{{ ts.t()('dash.balance') }}</span>
            <span class="material-icons-outlined text-xl">account_balance_wallet</span>
          </div>
          <ui-amount
            [value]="totalBalance()"
            [type]="totalBalance() < 0 ? 'expense' : 'income'"
            size="lg"
          />
        </div>

        <!-- Monthly Income -->
        <div class="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-sm">
          <div class="flex items-center justify-between text-ink-muted">
            <span class="text-xs font-semibold uppercase tracking-wider">{{ ts.t()('dash.income') }}</span>
            <span class="material-icons-outlined text-xl text-emerald-500">arrow_circle_up</span>
          </div>
          <ui-amount
            [value]="totalIncome()"
            type="income"
            size="lg"
          />
        </div>

        <!-- Monthly Expenses -->
        <div class="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-sm">
          <div class="flex items-center justify-between text-ink-muted">
            <span class="text-xs font-semibold uppercase tracking-wider">{{ ts.t()('dash.expenses') }}</span>
            <span class="material-icons-outlined text-xl text-expense">arrow_circle_down</span>
          </div>
          <ui-amount
            [value]="totalExpense()"
            type="expense"
            size="lg"
          />
        </div>
      </div>

      <!-- Main Visual Grid: Category Spending List + Cashflow History Chart -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <!-- Category Spending List (§5.1) -->
        <div class="p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <h2 class="text-base sm:text-lg font-bold font-heading text-ink">
                {{ spendingSectionTitle() }}
              </h2>
              <p class="text-xs text-ink-muted mt-0.5">
                Seguimiento contra límites mensuales y presupuestos anuales
              </p>
            </div>
            <a
              routerLink="/expenses"
              class="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 select-none"
            >
              <span>{{ ts.t()('nav.expenses') }}</span>
              <span class="material-icons-outlined text-sm">arrow_forward</span>
            </a>
          </div>

          <app-category-spending-list
            [rows]="categoryRows()"
            [monthTotal]="totalExpense()"
            [hasAnyBudget]="hasAnyBudget()"
            (rowSelected)="onCategorySelected($event)"
          />
        </div>

        <!-- 12-Month Cashflow Chart -->
        <div class="p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <h2 class="text-base sm:text-lg font-bold font-heading text-ink">
                {{ ts.t()('dash.overview') }}
              </h2>
              <p class="text-xs text-ink-muted mt-0.5">
                Comparativa de ingresos y egresos de los últimos 12 meses
              </p>
            </div>
          </div>

          <div class="h-80 w-full pt-2">
            <canvas
              baseChart
              [data]="barChartData"
              [type]="'bar'"
              [options]="barChartOptions"
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private apiService = inject(ApiService);
  ts = inject(TranslationService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentDate = signal<Date>(new Date());
  isLoading = signal<boolean>(false);

  // Financial totals
  totalBalance = signal<number>(0);
  totalIncome = signal<number>(0);
  totalExpense = signal<number>(0);

  // Category & Budget Data
  categories = signal<Category[]>([]);
  categoryStats = signal<MonthlyStats>({});
  monthlyBudgets = signal<Budget[]>([]);
  yearlyBudgets = signal<Budget[]>([]);

  // Computed joins
  allBudgets = computed(() => [...this.monthlyBudgets(), ...this.yearlyBudgets()]);
  hasAnyBudget = computed(() => this.allBudgets().length > 0);
  categoryRows = computed(() =>
    buildCategorySpendingRows(this.categoryStats(), this.allBudgets(), this.categories())
  );

  spendingSectionTitle = computed(() => {
    const d = this.currentDate();
    const monthName = new Intl.DateTimeFormat(this.ts.currentLang() === 'es' ? 'es-DO' : 'en-US', {
      month: 'long',
    }).format(d);
    const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return this.ts.t()('dashboard.spending_title', { month: capitalized });
  });

  // History cache
  private lastIncomes: any[] = [];
  private lastExpenseTotals: number[] = [];
  private refreshSubscription: Subscription | null = null;

  // 12-Month Bar Chart
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Ingresos',
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        data: [],
        label: 'Gastos',
        backgroundColor: '#e11d48',
        borderRadius: 6,
      },
    ],
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'inherit', size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'inherit', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'inherit', size: 11 } },
      },
    },
  };

  constructor() {
    // React to theme and language changes to update chart styling
    effect(() => {
      this.themeService.darkMode();
      this.ts.currentLang();
      this.updateChartThemeAndLabels();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.loadCategoriesOnce();
    this.loadData();

    // 30-second polling for background updates
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadData(true);
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  onMonthChange(newDate: Date): void {
    this.currentDate.set(newDate);
    this.loadData();
  }

  onCategorySelected(row: CategorySpendingRow): void {
    const target = this.currentDate();
    const queryParams: Record<string, string | number> = {
      month: target.getMonth() + 1,
      year: target.getFullYear(),
    };
    if (row.categoryId !== null) {
      queryParams['category'] = row.categoryId;
    }
    this.router.navigate(['/expenses'], { queryParams });
  }

  private loadCategoriesOnce(): void {
    this.apiService
      .getCategories()
      .pipe(catchError(() => of([])))
      .subscribe((cats) => {
        this.categories.set(cats || []);
      });
  }

  loadData(isBackground = false): void {
    const targetDate = this.currentDate();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    if (!isBackground) {
      this.isLoading.set(true);
      this.apiService.clearCache('expenses');
      this.apiService.clearCache('incomes');
      this.apiService.clearCache('dashboard');
    }

    // 1. Fast Path: Expense total, category stats, monthly budgets, and yearly budgets
    forkJoin({
      expenseTotal: this.apiService
        .getExpensesMonthTotal(year, month)
        .pipe(catchError(() => of({ total: 0 }))),
      categoryStats: this.apiService
        .getExpensesByCategory(year, month)
        .pipe(catchError(() => of({} as MonthlyStats))),
      monthlyBudgets: this.apiService
        .getMonthlyBudgets(year, month)
        .pipe(catchError(() => of([] as Budget[]))),
      yearlyBudgets: this.fetchYearlyBudgets(year),
      incomePage: this.apiService
        .getIncomes(0, 100)
        .pipe(catchError(() => of({ content: [] } as any))),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ expenseTotal, categoryStats, monthlyBudgets, yearlyBudgets, incomePage }) => {
          this.totalExpense.set(expenseTotal?.total || 0);
          this.categoryStats.set(categoryStats || {});
          this.monthlyBudgets.set(monthlyBudgets || []);
          this.yearlyBudgets.set(yearlyBudgets || []);

          const currentMonthIncomes = incomePage.content
            ? incomePage.content.filter((i: any) => {
                const [y, m] = i.date.toString().split('-');
                return parseInt(m, 10) === month && parseInt(y, 10) === year;
              })
            : [];
          const incomeTotal = currentMonthIncomes.reduce(
            (acc: number, curr: any) => acc + curr.amount,
            0,
          );
          this.totalIncome.set(incomeTotal);
          this.totalBalance.set(this.totalIncome() - this.totalExpense());
        },
      });

    // 2. Chart: 12 monthly expense totals in parallel (DOP-converted by the API) plus the
    // income history, which is small. Does not block the loading state of the fast path.
    forkJoin({
      incomes: this.fetchAllHistory(
        (p, s) => this.apiService.getIncomes(p, s),
        new Date(year, month - 12, 1),
      ).pipe(catchError(() => of([]))),
      expenseTotals: this.fetchExpenseTotals(targetDate),
    }).subscribe({
      next: ({ incomes, expenseTotals }) => {
        const currentMonthIncomes = incomes
          ? incomes.filter((i: any) => {
              const [y, m] = i.date.toString().split('-');
              return parseInt(m, 10) === month && parseInt(y, 10) === year;
            })
          : [];
        const incomeTotal = currentMonthIncomes.reduce(
          (acc: number, curr: any) => acc + curr.amount,
          0,
        );
        this.totalIncome.set(incomeTotal);
        this.totalBalance.set(this.totalIncome() - this.totalExpense());

        this.lastIncomes = incomes;
        this.lastExpenseTotals = expenseTotals;
        this.prepareHistoryChart(incomes, expenseTotals);
      },
    });
  }

  /** One `/expenses/month/{y}/{m}/total` request per chart month, oldest first. */
  private fetchExpenseTotals(anchor: Date): Observable<number[]> {
    return forkJoin(
      lastTwelveMonths(anchor).map(({ year, month }) =>
        this.apiService.getExpensesMonthTotal(year, month).pipe(
          map((res) => Number(res?.total) || 0),
          catchError(() => of(0)),
        ),
      ),
    );
  }

  private fetchYearlyBudgets(selectedYear: number): Observable<Budget[]> {
    return this.apiService.getBudgets(0, 100).pipe(
      expand((res) => {
        const page = res.page;
        if (!page || page.number + 1 >= page.totalPages) {
          return EMPTY;
        }
        return this.apiService.getBudgets(page.number + 1, 100);
      }),
      reduce((acc, res) => acc.concat(res.content || []), [] as Budget[]),
      map((all) =>
        all.filter((b) => {
          if (b.period !== 'YEARLY') return false;
          const bYear = b.year ?? (b.startDate ? new Date(b.startDate).getFullYear() : null);
          return bYear === selectedYear;
        }),
      ),
      catchError(() => of([] as Budget[])),
    );
  }

  private fetchAllHistory<T extends { date: string }>(
    fetchFn: (page: number, size: number) => Observable<PagedResponse<T>>,
    since: Date,
  ): Observable<T[]> {
    return fetchFn(0, 100).pipe(
      expand((res: PagedResponse<T>) => {
        const content = res.content || [];
        if (content.length === 0 || res.page.number >= res.page.totalPages - 1) {
          return EMPTY;
        }

        const lastItem = content[content.length - 1];
        const lastDate = new Date(lastItem.date);
        if (lastDate < since) {
          return EMPTY;
        }

        return fetchFn(res.page.number + 1, 100);
      }),
      reduce((acc, res) => acc.concat(res.content || []), [] as T[]),
    );
  }

  prepareHistoryChart(incomes: any[], expenseTotals: number[]): void {
    const months: string[] = [];
    const incomeData: number[] = new Array(12).fill(0);
    const expenseData: number[] = new Array(12).fill(0);

    const today = this.currentDate();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString(this.ts.currentLang() === 'es' ? 'es-ES' : 'en-US', {
        month: 'short',
      });
      months.push(monthName);

      const yearToCheck = d.getFullYear();
      const monthToCheck = d.getMonth();

      const monthIncome = incomes
        .filter((t) => {
          const [y, m] = t.date.toString().split('-');
          return parseInt(m, 10) === monthToCheck + 1 && parseInt(y, 10) === yearToCheck;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const index = 11 - i;
      incomeData[index] = monthIncome;
      expenseData[index] = expenseTotals[index] ?? 0;
    }

    const incomeColor = readToken('income') || '#10b981';
    const expenseColor = readToken('expense') || '#e11d48';

    this.barChartData = {
      labels: months,
      datasets: [
        {
          data: incomeData,
          label: this.ts.t()('dash.income'),
          backgroundColor: incomeColor,
          borderRadius: 6,
        },
        {
          data: expenseData,
          label: this.ts.t()('dash.expenses'),
          backgroundColor: expenseColor,
          borderRadius: 6,
        },
      ],
    };
  }

  private updateChartThemeAndLabels(): void {
    const incomeColor = readToken('income') || '#10b981';
    const expenseColor = readToken('expense') || '#e11d48';
    const borderColor = readToken('border') || 'rgba(255,255,255,0.08)';
    const textColor = readToken('ink-muted') || '#94a3b8';

    if (this.barChartData.datasets.length >= 2) {
      this.barChartData.datasets[0].backgroundColor = incomeColor;
      this.barChartData.datasets[0].label = this.ts.t()('dash.income');
      this.barChartData.datasets[1].backgroundColor = expenseColor;
      this.barChartData.datasets[1].label = this.ts.t()('dash.expenses');
    }

    if (this.barChartOptions?.scales) {
      if (this.barChartOptions.scales['x']) {
        this.barChartOptions.scales['x'].grid = { color: borderColor };
        this.barChartOptions.scales['x'].ticks = {
          color: textColor,
          font: { family: 'inherit', size: 11 },
        };
      }
      if (this.barChartOptions.scales['y']) {
        this.barChartOptions.scales['y'].grid = { color: borderColor };
        this.barChartOptions.scales['y'].ticks = {
          color: textColor,
          font: { family: 'inherit', size: 11 },
        };
      }
    }

    if (this.barChartOptions?.plugins?.legend?.labels) {
      this.barChartOptions.plugins.legend.labels.color = textColor;
    }

    if (this.lastIncomes.length > 0 || this.lastExpenseTotals.length > 0) {
      this.prepareHistoryChart(this.lastIncomes, this.lastExpenseTotals);
    }
  }
}
