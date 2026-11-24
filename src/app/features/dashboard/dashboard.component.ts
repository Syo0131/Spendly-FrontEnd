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
import { forkJoin, of, interval, Subscription, EMPTY, Observable } from 'rxjs';
import { catchError, expand, reduce, map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BaseChartDirective, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 transition-opacity duration-300" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row justify-between md:items-center gap-4 animate-fade-in-up"
      >
        <div>
          <h1 class="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('dash.title') }}
          </h1>
          <p class="text-xs md:text-base text-gray-500 dark:text-gray-400">
            {{ ts.t()('dash.welcome') }}, {{ authService.currentUserStr() }}
          </p>
        </div>

        <!-- Month Selector -->
        <div
          class="flex items-center justify-between w-full md:w-auto bg-white dark:bg-white/5 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-white/10"
        >
          <button
            (click)="prevMonth()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
          >
            <span class="material-icons-outlined">chevron_left</span>
          </button>

          <button
            (click)="openDatePicker()"
            class="px-2 font-semibold text-gray-700 dark:text-gray-200 flex-1 md:flex-none md:w-40 text-center whitespace-nowrap hover:bg-gray-50 dark:hover:bg-white/5 py-1 rounded cursor-pointer transition-colors"
          >
            {{ currentDate() | date : 'MMMM yyyy' }}
          </button>

          <button
            (click)="nextMonth()"
            [disabled]="isCurrentMonth()"
            [class.opacity-50]="isCurrentMonth()"
            [class.cursor-not-allowed]="isCurrentMonth()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
          >
            <span class="material-icons-outlined">chevron_right</span>
          </button>
        </div>
        <!-- <button
          class="hidden md:flex items-center justify-center px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          title="Download Report"
        >
          <span class="material-icons-outlined text-xl md:hidden">download</span>
          <span class="hidden md:inline text-sm font-medium">Download Report</span>
        </button> -->
      </div>

      <!-- Month Picker Modal -->
      @defer (when showDatePicker()) {
      @if (showDatePicker()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        (click)="closeDatePicker()"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-sm animate-scale-in"
          (click)="$event.stopPropagation()"
        >
          <!-- Year Selector -->
          <div class="flex items-center justify-between mb-6">
            <button
              (click)="changeYear(-1)"
              class="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <span class="material-icons-outlined">chevron_left</span>
            </button>
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              {{ tempDate().getFullYear() }}
            </span>
            <button
              (click)="changeYear(1)"
              class="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <span class="material-icons-outlined">chevron_right</span>
            </button>
          </div>

          <!-- Months Grid -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            @for (month of months; track $index; let i = $index) {
            <button
              (click)="selectMonth(i)"
              [disabled]="isFutureMonth(i)"
              class="p-3 rounded-xl text-sm font-medium transition-all"
              [class.bg-primary]="isSelectedMonth(i)"
              [class.text-white]="isSelectedMonth(i)"
              [class.shadow-lg]="isSelectedMonth(i)"
              [class.shadow-primary/30]="isSelectedMonth(i)"
              [class.bg-gray-50]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.dark:bg-white/5]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.text-gray-700]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.dark:text-gray-300]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.hover:bg-gray-100]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.dark:hover:bg-white/10]="!isSelectedMonth(i) && !isFutureMonth(i)"
              [class.opacity-30]="isFutureMonth(i)"
              [class.cursor-not-allowed]="isFutureMonth(i)"
            >
              {{ month }}
            </button>
            }
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              (click)="closeDatePicker()"
              class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmDateSelection()"
              class="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      }
      }

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up delay-100">
        <!-- Balance -->
        <div
          class="glass-card p-4 md:p-6 relative overflow-hidden group bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/70 transition-colors"
        >
          <div
            class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
          >
            <span class="material-icons-outlined text-4xl md:text-6xl text-primary"
              >account_balance_wallet</span
            >
          </div>
          <p class="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {{ ts.t()('dash.balance') }}
          </p>
          <h3
            class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white"
            [class.text-red-500]="totalBalance() < 0"
          >
            {{ totalBalance() | currency : 'DOP' : 'symbol' : '1.2-2' }}
          </h3>
        </div>

        <!-- Income -->
        <div
          class="glass-card p-4 md:p-6 relative overflow-hidden group bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/70 transition-colors"
        >
          <div
            class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
          >
            <span class="material-icons-outlined text-4xl md:text-6xl text-secondary">arrow_circle_up</span>
          </div>
          <p class="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {{ ts.t()('dash.income') }}
          </p>
          <h3 class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
            {{ totalIncome() | currency : 'DOP' : 'symbol' : '1.2-2' }}
          </h3>
        </div>

        <!-- Expenses -->
        <div
          class="glass-card p-4 md:p-6 relative overflow-hidden group bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/70 transition-colors"
        >
          <div
            class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
          >
            <span class="material-icons-outlined text-4xl md:text-6xl text-danger">arrow_circle_down</span>
          </div>
          <p class="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {{ ts.t()('dash.expenses') }}
          </p>
          <h3 class="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
            {{ totalExpense() | currency : 'DOP' : 'symbol' : '1.2-2' }}
          </h3>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up delay-200">
        <!-- Expense Breakdown -->
        <div
          class="glass-card p-6 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
        >
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6">
            {{ ts.t()('dash.breakdown') }}
          </h3>
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
              <div class="w-40 h-40 rounded-full border-8 border-gray-200 dark:border-white/10"></div>
            </div>
            }
          </div>
        </div>

        <!-- Income vs Expense -->
        <div
          class="glass-card p-6 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
        >
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-6">
            {{ ts.t()('dash.overview') }}
          </h3>
          <div class="h-64">
            @defer (on viewport) {
            <canvas baseChart [data]="barChartData" [type]="'bar'" [options]="barChartOptions">
            </canvas>
            } @placeholder {
            <div class="w-full h-full flex items-end gap-4 animate-pulse px-4">
               <div class="w-1/6 h-[40%] bg-gray-200 dark:bg-white/10 rounded-t"></div>
               <div class="w-1/6 h-[70%] bg-gray-200 dark:bg-white/10 rounded-t"></div>
               <div class="w-1/6 h-[50%] bg-gray-200 dark:bg-white/10 rounded-t"></div>
               <div class="w-1/6 h-[80%] bg-gray-200 dark:bg-white/10 rounded-t"></div>
               <div class="w-1/6 h-[60%] bg-gray-200 dark:bg-white/10 rounded-t"></div>
               <div class="w-1/6 h-[90%] bg-gray-200 dark:bg-white/10 rounded-t"></div>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
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

  // Charts Config
  doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#8b5cf6', '#06b6d4', '#fb7185', '#fbbf24'],
        hoverBackgroundColor: ['#7c3aed', '#0891b2', '#f43f5e', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#94a3b8' } },
    },
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Income',
        backgroundColor: '#06b6d4',
        borderRadius: 4,
      },
      {
        data: [],
        label: 'Expense',
        backgroundColor: '#fb7185',
        borderRadius: 4,
      },
    ],
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    },
    plugins: {
      legend: { labels: { color: '#94a3b8' } },
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
    private cdr: ChangeDetectorRef
  ) {
    // React to language changes to update chart labels
    effect(() => {
      const lang = this.ts.currentLang(); // dependency
      // Update Bar Chart Labels
      this.prepareHistoryChart(this.lastIncomes, this.lastExpenses);

      // Update Doughnut Chart (Categories)
      this.updateDoughnutChart();

      this.cdr.markForCheck();
    });
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
          backgroundColor: ['#8b5cf6', '#06b6d4', '#fb7185', '#fbbf24', '#10b981', '#f59e0b'],
          hoverBackgroundColor: ['#7c3aed', '#0891b2', '#f43f5e', '#f59e0b', '#059669', '#d97706'],
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
          backgroundColor: '#06b6d4',
          borderRadius: 4,
        },
        {
          data: expenseData,
          label: this.ts.t()('dash.expenses'),
          backgroundColor: '#fb7185',
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
