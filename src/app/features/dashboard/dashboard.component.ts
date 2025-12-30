import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row justify-between md:items-center gap-4 animate-fade-in-up"
      >
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('dash.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            {{ ts.t()('dash.welcome') }}, {{ authService.currentUserStr() }}
          </p>
        </div>
        <!-- <button
          class="hidden md:flex items-center justify-center px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          title="Download Report"
        >
          <span class="material-icons-outlined text-xl md:hidden">download</span>
          <span class="hidden md:inline text-sm font-medium">Download Report</span>
        </button> -->
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up delay-100">
        <!-- Balance -->
        <div
          class="glass-card p-6 relative overflow-hidden group bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/70 transition-colors"
        >
          <div
            class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
          >
            <span class="material-icons-outlined text-6xl text-primary"
              >account_balance_wallet</span
            >
          </div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {{ ts.t()('dash.balance') }}
          </p>
          <h3
            class="text-3xl font-bold text-gray-900 dark:text-white"
            [class.text-red-500]="totalBalance() < 0"
          >
            {{ totalBalance() | currency : 'DOP' : 'symbol' : '1.2-2' }}
          </h3>
          <div class="mt-4 flex items-center md:text-sm text-xs">
            <span
              class="text-green-600 dark:text-green-400 flex items-center bg-green-100 dark:bg-green-400/10 px-2 py-1 rounded-full"
            >
              <span class="material-icons-outlined text-xs mr-1">trending_up</span> +12%
            </span>
            <span class="ml-2 text-gray-400 font-light">vs last month</span>
          </div>
        </div>

        <!-- Income -->
        <div
          class="glass-card p-6 relative overflow-hidden group bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/70 transition-colors"
        >
          <div
            class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
          >
            <span class="material-icons-outlined text-6xl text-secondary">arrow_circle_up</span>
          </div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {{ ts.t()('dash.income') }}
          </p>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ totalIncome() | currency : 'DOP' : 'symbol' : '1.2-2' }}
          </h3>
        </div>

        <!-- Expenses -->
        <div
          class="glass-card p-6 relative overflow-hidden group bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800/70 transition-colors"
        >
          <div
            class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
          >
            <span class="material-icons-outlined text-6xl text-danger">arrow_circle_down</span>
          </div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {{ ts.t()('dash.expenses') }}
          </p>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white">
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
            <canvas
              baseChart
              [data]="doughnutChartData"
              [type]="'doughnut'"
              [options]="doughnutChartOptions"
            >
            </canvas>
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
            <canvas baseChart [data]="barChartData" [type]="'bar'" [options]="barChartOptions">
            </canvas>
          </div>
        </div>
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
export class DashboardComponent implements OnInit {
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

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    public ts: TranslationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // API expects 1-12

    // 1. Get Monthly Totals (Keep existing Logic for Cards)
    this.apiService.getExpensesMonthTotal(year, month).subscribe({
      next: (res: any) => {
        const expenseTotal = typeof res === 'number' ? res : res.total || res.amount || 0;
        this.totalExpense.set(expenseTotal);
        this.updateBalance();
      },
    });

    // 2. Fetch DATA for Charts (Incomes & Expenses)
    // We fetch a decent amount to calculate client-side history since backend endpoint might be missing
    // or we want dynamic "Last 6 Months".

    // Use forkJoin to get both in parallel
    forkJoin({
      incomes: this.apiService.getIncomes(0, 100),
      expenses: this.apiService.getExpenses(0, 100),
      categoryStats: this.apiService.getExpensesByCategory(year, month),
    }).subscribe({
      next: ({ incomes, expenses, categoryStats }) => {
        // A. Update Income Total Card (Current Month)
        const currentMonthIncomes = incomes.content.filter((i) => {
          const d = new Date(i.date);
          return d.getMonth() + 1 === month && d.getFullYear() === year;
        });
        const incomeTotal = currentMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
        this.totalIncome.set(incomeTotal);
        this.updateBalance();

        // B. Prepare Doughnut Chart (Categories)
        const labels = Object.keys(categoryStats);
        const data = Object.values(categoryStats);
        this.doughnutChartData = {
          labels: labels.length ? labels : ['No Data'],
          datasets: [
            {
              data: data.length ? data : [1],
              backgroundColor: labels.length
                ? ['#8b5cf6', '#06b6d4', '#fb7185', '#fbbf24', '#10b981', '#6366f1']
                : ['#e2e8f0'],
              borderWidth: 0,
            },
          ],
        };

        // C. Prepare Bar Chart (Last 6 Months History)
        this.prepareHistoryChart(incomes.content, expenses.content);
      },
      error: (err) => console.error('Error loading dashboard data', err),
    });
  }

  prepareHistoryChart(incomes: any[], expenses: any[]) {
    // 1. Generate last 6 month labels
    const months: string[] = [];
    const incomeData: number[] = [0, 0, 0, 0, 0, 0];
    const expenseData: number[] = [0, 0, 0, 0, 0, 0];

    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      months.push(monthName);

      // Filter and sum for this specific month/year
      const yearToCheck = d.getFullYear();
      const monthToCheck = d.getMonth(); // 0-indexed

      const monthIncome = incomes
        .filter((t) => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === monthToCheck && tDate.getFullYear() === yearToCheck;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpense = expenses
        .filter((t) => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === monthToCheck && tDate.getFullYear() === yearToCheck;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Map to array index (5 - i)
      // i=5 (oldest) -> index 0
      // i=0 (current) -> index 5
      const index = 5 - i;
      incomeData[index] = monthIncome;
      expenseData[index] = monthExpense;
    }

    this.barChartData = {
      labels: months,
      datasets: [
        {
          data: incomeData,
          label: 'Income',
          backgroundColor: '#06b6d4',
          borderRadius: 4,
        },
        {
          data: expenseData,
          label: 'Expense',
          backgroundColor: '#fb7185',
          borderRadius: 4,
        },
      ],
    };
  }

  updateBalance() {
    this.totalBalance.set(this.totalIncome() - this.totalExpense());
  }
}
