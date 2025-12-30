import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { ExpenseResponse, Category } from '../../core/models/api.models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ ts.t()('nav.expenses') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400">Track your spending habits</p>
        </div>
        <button
          (click)="openModal()"
          class="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105"
        >
          <span class="material-icons-outlined mr-2">add</span>
          {{ ts.t()('trans.add_expense') }}
        </button>
      </div>

      <!-- Tabs -->
      <div
        class="flex space-x-1 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit backdrop-blur-sm border border-gray-200 dark:border-white/5"
      >
        <a
          routerLink="/expenses"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
        >
          {{ ts.t()('nav.expenses') }}
        </a>
        <a
          routerLink="/incomes"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          {{ ts.t()('nav.incomes') }}
        </a>
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
                *ngFor="let item of expenses()"
                class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td class="p-4 text-gray-900 dark:text-white font-medium">
                  {{ item.description }}
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400">
                  <span
                    class="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10"
                  >
                    {{ item.category.name || 'General' }}
                  </span>
                </td>
                <td class="p-4 text-gray-500 dark:text-gray-400 text-sm">
                  {{ item.date | date }}
                </td>
                <td class="p-4 text-right font-bold text-rose-600 dark:text-rose-400">
                  - {{ item.amount | currency : 'DOP' : 'symbol' : '1.2-2' }}
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
              <tr *ngIf="expenses().length === 0">
                <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">
                  {{ ts.t()('trans.no_data') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
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
            <span class="material-icons-outlined text-3xl text-primary dark:text-primary-light">
              receipt_long
            </span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ editingId() ? ts.t()('trans.edit_expense') : ts.t()('trans.add_expense') }}
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
                <span class="absolute left-3 top-3 text-gray-500 dark:text-gray-400">$</span>
                <input
                  formControlName="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  (keydown)="preventNonNumeric($event)"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 pl-7 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder-gray-400 dark:placeholder-gray-600"
                />
              </div>
            </div>
            <div class="space-y-1.5">
              <label
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >{{ ts.t()('trans.date') }}</label
              >
              <div class="relative">
                <input
                  formControlName="date"
                  type="date"
                  class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <!-- Category -->
          <div class="space-y-1.5">
            <label
              class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >{{ ts.t()('trans.category') }}</label
            >
            <div class="relative">
              <!-- Custom Trigger -->
              <div
                (click)="toggleDropdown()"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all group"
                [class.border-red-500]="
                  form.get('categoryId')?.invalid && form.get('categoryId')?.touched
                "
              >
                <div class="flex items-center gap-2">
                  <ng-container *ngIf="getSelectedCategory() as selected; else placeholder">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      [style.background-color]="selected.color + '20'"
                    >
                      <span class="material-icons-outlined text-lg" [style.color]="selected.color">
                        {{ selected.icons }}
                      </span>
                    </div>
                    <span class="text-gray-900 dark:text-white font-medium">
                      {{ selected.name }}
                    </span>
                  </ng-container>
                  <ng-template #placeholder>
                    <span class="text-gray-400">
                      {{ ts.t()('trans.select_category') }}
                    </span>
                  </ng-template>
                </div>
                <span
                  class="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors"
                  [class.rotate-180]="isDropdownOpen()"
                >
                  expand_more
                </span>
              </div>

              <!-- Dropdown Menu -->
              <div
                *ngIf="isDropdownOpen()"
                class="custom-scrollbar absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-scale-in"
              >
                <div
                  *ngFor="let cat of categories()"
                  (click)="selectCategory(cat)"
                  class="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    [style.background-color]="cat.color + '20'"
                  >
                    <span class="material-icons-outlined text-lg" [style.color]="cat.color">
                      {{ cat.icons }}
                    </span>
                  </div>
                  <span class="text-gray-700 dark:text-gray-200 font-medium">
                    {{ cat.name }}
                  </span>
                </div>
                <div
                  *ngIf="categories().length === 0"
                  class="p-4 text-center text-gray-500 text-sm"
                >
                  {{ ts.t()('trans.loading_cat') }}
                </div>
              </div>
            </div>
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
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ ts.t()('trans.delete_title') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          {{ ts.t()('trans.delete_msg') }}
        </p>
        <div class="flex space-x-3 justify-center">
          <button
            (click)="cancelDelete()"
            class="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            {{ ts.t()('trans.cancel') }}
          </button>
          <button
            (click)="confirmDelete()"
            class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02]"
          >
            {{ ts.t()('trans.delete') }}
          </button>
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

      /* Custom Scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
        margin-block: 4px; /* Simulate padding top/bottom to clear rounded corners */
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #cbd5e1; /* slate-300 */
        border-radius: 20px;
      }
      :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #475569; /* slate-600 */
      }
    `,
  ],
})
export class ExpensesComponent implements OnInit {
  expenses = signal<ExpenseResponse[]>([]);
  categories = signal<Category[]>([]);

  form: FormGroup;
  showModal = signal(false);
  editingId = signal<number | null>(null);

  // Dropdown state
  isDropdownOpen = signal(false);

  // Delete Modal State
  showDeleteModal = signal(false);
  itemToDelete = signal<any>(null);

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public ts: TranslationService
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      currency: ['DOP'],
      categoryId: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.loadData();
    this.loadCategories();
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
    this.apiService.getExpenses(0, 50).subscribe({
      next: (res) => this.expenses.set(res.content),
      error: (err) => console.error('Error loading expenses', err),
    });
  }

  toggleDropdown() {
    this.isDropdownOpen.update((v) => !v);
  }

  selectCategory(category: Category) {
    this.form.patchValue({ categoryId: category.id });
    this.isDropdownOpen.set(false);
  }

  getSelectedCategory(): Category | undefined {
    const id = this.form.get('categoryId')?.value;
    return this.categories().find((c) => c.id === id);
  }

  openModal(itemToEdit: any = null) {
    this.isDropdownOpen.set(false);
    if (itemToEdit) {
      this.editingId.set(itemToEdit.id);
      this.form.patchValue({
        description: itemToEdit.description,
        amount: itemToEdit.amount,
        date: itemToEdit.date,
        currency: 'DOP',
        categoryId: itemToEdit.category?.id || 1,
      });
    } else {
      this.editingId.set(null);
      this.form.reset({
        date: new Date().toISOString().split('T')[0],
        currency: 'DOP',
        categoryId: null,
        amount: 0,
        description: '',
      });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.isDropdownOpen.set(false);
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      const id = this.editingId();
      const payload = { ...formData, categoryId: Number(formData.categoryId) };

      if (id) {
        this.apiService.updateExpense(id, payload).subscribe(this.handleResponseObserver);
      } else {
        this.apiService.createExpense(payload).subscribe(this.handleResponseObserver);
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

    this.apiService.deleteExpense(Number(item.id)).subscribe(() => {
      this.cancelDelete();
      this.loadData();
    });
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.itemToDelete.set(null);
  }

  preventNonNumeric(event: KeyboardEvent) {
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', '.'].indexOf(
        event.key
      ) !== -1 ||
      (event.ctrlKey === true && ['a', 'c', 'v', 'x'].indexOf(event.key.toLowerCase()) !== -1)
    ) {
      return;
    }
    if (isNaN(Number(event.key))) {
      event.preventDefault();
    }
  }
}
