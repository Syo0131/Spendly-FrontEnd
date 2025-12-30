import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { IncomeResponse, ExpenseResponse, Category } from '../../core/models/api.models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ getTitle() }}</h1>
          <p class="text-gray-500 dark:text-gray-400">{{ getSubtitle() }}</p>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105"
        >
          <span class="material-icons-outlined mr-2">add</span>
          {{ activeTab() === 'incomes' ? ts.t()('trans.add_income') : ts.t()('trans.add_expense') }}
        </button>
      </div>

      <!-- Tabs (Hidden if forced via route) -->
      <div
        *ngIf="!forcedType"
        class="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit backdrop-blur-sm border border-gray-200 dark:border-white/5"
      >
        <button
          (click)="activeTab.set('expenses')"
          [class]="
            activeTab() === 'expenses'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          "
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all"
        >
          {{ ts.t()('nav.expenses') }}
        </button>
        <button
          (click)="activeTab.set('incomes')"
          [class]="
            activeTab() === 'incomes'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          "
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all"
        >
          {{ ts.t()('nav.incomes') }}
        </button>
      </div>

      <!-- List -->
      <div
        class="glass-card overflow-hidden bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead
              class="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider"
            >
              <tr>
                <th class="p-4 font-medium">{{ ts.t()('trans.desc') }}</th>
                <th class="p-4 font-medium">{{ ts.t()('trans.category') }}</th>
                <th class="p-4 font-medium">{{ ts.t()('trans.date') }}</th>
                <th class="p-4 font-medium text-right">{{ ts.t()('trans.amount') }}</th>
                <th class="p-4 font-medium text-center"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-white/5">
              <tr
                *ngFor="let item of transactions()"
                class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td class="p-4 text-gray-900 dark:text-white font-medium">
                  {{ item.description }}
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400">
                  <span
                    *ngIf="activeTab() === 'expenses'"
                    class="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                  >
                    {{ $any(item).category?.name || 'General' }}
                  </span>
                  <span
                    *ngIf="activeTab() === 'incomes'"
                    class="px-2 py-1 rounded text-xs bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-200 border border-teal-200 dark:border-teal-800"
                  >
                    Income
                  </span>
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400 text-sm">{{ item.date | date }}</td>
                <td
                  class="p-4 text-right font-bold"
                  [class.text-teal-600]="activeTab() === 'incomes'"
                  [class.dark:text-teal-400]="activeTab() === 'incomes'"
                  [class.text-rose-600]="activeTab() === 'expenses'"
                  [class.dark:text-rose-400]="activeTab() === 'expenses'"
                >
                  {{ activeTab() === 'incomes' ? '+' : '-' }}
                  {{ item.amount | currency : 'DOP' : 'symbol' : '1.2-2' }}
                </td>
                <td class="p-4 text-center">
                  <div class="flex items-center justify-end gap-1 opacity-100">
                    <button
                      (click)="openModal(item)"
                      class="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <span class="material-icons-outlined text-lg">edit</span>
                    </button>
                    <button
                      (click)="deleteItem(item)"
                      class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <span class="material-icons-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="transactions().length === 0">
                <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">
                  {{ ts.t()('trans.no_data') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      *ngIf="showModal()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        class="glass-card w-full max-w-lg p-8 relative animate-scale-in bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl"
      >
        <button
          (click)="closeModal()"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
        >
          <span class="material-icons-outlined">close</span>
        </button>

        <div class="text-center mb-8">
          <div
            class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons-outlined text-3xl text-primary">
              {{ activeTab() === 'incomes' ? 'attach_money' : 'receipt_long' }}
            </span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{
              editingId()
                ? activeTab() === 'incomes'
                  ? 'Edit Income'
                  : 'Edit Expense'
                : activeTab() === 'incomes'
                ? ts.t()('trans.add_income')
                : ts.t()('trans.add_expense')
            }}
          </h2>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Description -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >{{ ts.t()('trans.desc') }}</label
            >
            <input
              formControlName="description"
              type="text"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>

          <!-- Amount & Date Row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >{{ ts.t()('trans.amount') }}</label
              >
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  formControlName="amount"
                  type="number"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 pl-7 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400 dark:placeholder-gray-600"
                />
              </div>
            </div>
            <div class="space-y-1.5">
              <label
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >{{ ts.t()('trans.date') }}</label
              >
              <input
                formControlName="date"
                type="date"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <!-- Category (Only for Expenses) -->
          <div class="space-y-1.5" *ngIf="activeTab() === 'expenses'">
            <label
              class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >{{ ts.t()('trans.category') }}</label
            >
            <select
              formControlName="categoryId"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option *ngFor="let cat of categories()" [value]="cat.id">
                {{ cat.name }}
              </option>
              <option *ngIf="categories().length === 0" [value]="1" disabled>
                {{ ts.t()('trans.loading_cat') }}
              </option>
            </select>
          </div>

          <button
            type="submit"
            [disabled]="form.invalid"
            class="w-full mt-6 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {{ editingId() ? 'Update' : ts.t()('trans.save') }}
          </button>
        </form>
      </div>
      <!-- Delete Modal -->
      <div
        *ngIf="showDeleteModal()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      >
        <div
          class="glass-card w-full max-w-sm p-6 relative animate-scale-in bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl text-center"
        >
          <div
            class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons-outlined text-3xl text-red-500">warning</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Transaction?</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            This action cannot be undone. Are you sure you want to remove this item?
          </p>
          <div class="flex space-x-3 justify-center">
            <button
              (click)="cancelDelete()"
              class="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirmDelete()"
              class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .animate-fade-in-up {
        animation: fadeInUp 0.5s ease-out forwards;
      }
      .animate-scale-in {
        animation: scaleIn 0.2s ease-out forwards;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
})
export class TransactionsComponent implements OnInit {
  activeTab = signal<'incomes' | 'expenses'>('expenses');
  forcedType: 'incomes' | 'expenses' | null = null;

  incomes = signal<IncomeResponse[]>([]);
  expenses = signal<ExpenseResponse[]>([]);

  // Computed property to handle the union type for the template
  transactions = computed(() => {
    return (this.activeTab() === 'incomes' ? this.incomes() : this.expenses()) as any[];
  });

  categories = signal<Category[]>([]);

  form: FormGroup;
  showModal = signal(false);
  editingId = signal<number | null>(null);

  // Delete Modal State
  showDeleteModal = signal(false);
  itemToDelete = signal<any>(null);

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public ts: TranslationService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      currency: ['DOP'],
      categoryId: [1, Validators.required],
    });

    this.route.data.subscribe((data) => {
      if (data['type']) {
        this.forcedType = data['type'];
        this.activeTab.set(this.forcedType as any);
      }
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadCategories();

    // Check for query params to auto-open modal
    this.route.queryParams.subscribe((params) => {
      if (params['action'] === 'new') {
        this.openModal();
      }
    });
  }

  getTitle() {
    return this.activeTab() === 'incomes'
      ? this.ts.translate('nav.incomes')
      : this.ts.translate('nav.expenses');
  }

  getSubtitle() {
    return this.activeTab() === 'incomes'
      ? 'Manage your sources of income'
      : 'Track your spending habits';
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.categories.set(res);
        }
      },
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  loadData() {
    if (this.activeTab() === 'expenses' || !this.forcedType) {
      this.apiService.getExpenses(0, 50).subscribe({
        next: (res) => this.expenses.set(res.content),
        error: (err) => console.error('Error loading expenses', err),
      });
    }

    if (this.activeTab() === 'incomes' || !this.forcedType) {
      this.apiService.getIncomes(0, 50).subscribe({
        next: (res) => this.incomes.set(res.content),
        error: (err) => console.error('Error loading incomes', err),
      });
    }
  }

  openModal(itemToEdit: any = null) {
    if (itemToEdit) {
      this.editingId.set(itemToEdit.id);
      this.form.patchValue({
        description: itemToEdit.description,
        amount: itemToEdit.amount,
        date: itemToEdit.date,
        currency: 'DOP',
        categoryId: itemToEdit.categoryId || itemToEdit.category?.id || 1,
      });
    } else {
      this.editingId.set(null);
      this.form.reset({
        date: new Date().toISOString().split('T')[0],
        currency: 'DOP',
        categoryId: this.categories()[0]?.id || 1,
        amount: 0,
        description: '',
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      const isIncome = this.activeTab() === 'incomes';
      const id = this.editingId();

      const payload = { ...formData, categoryId: Number(formData.categoryId) };

      if (id) {
        // UPDATE
        if (isIncome) {
          this.apiService.updateIncome(id, payload).subscribe(this.handleResponseObserver);
        } else {
          this.apiService.updateExpense(id, payload).subscribe(this.handleResponseObserver);
        }
      } else {
        // CREATE
        if (isIncome) {
          this.apiService.createIncome(payload).subscribe(this.handleResponseObserver);
        } else {
          this.apiService.createExpense(payload).subscribe(this.handleResponseObserver);
        }
      }
    }
  }

  private handleResponseObserver = {
    next: () => {
      this.closeModal();
      this.loadData();
    },
    error: (err: any) => {
      console.error('Operation failed', err);
      alert('Error: ' + (err.error?.message || 'Check connection'));
    },
  };

  deleteItem(item: any) {
    this.itemToDelete.set(item);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    const id = item.id;
    if (this.activeTab() === 'incomes') {
      this.apiService.deleteIncome(id).subscribe(() => this.finalizeDelete());
    } else {
      this.apiService.deleteExpense(id).subscribe(() => this.finalizeDelete());
    }
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.itemToDelete.set(null);
  }

  private finalizeDelete() {
    this.cancelDelete();
    this.loadData();
  }
}
