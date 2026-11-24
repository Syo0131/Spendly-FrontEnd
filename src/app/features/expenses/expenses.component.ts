import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { ExpenseStateService } from '../../core/services/expense-state.service';
import { ExpenseResponse, Category } from '../../core/models/api.models';
import {
  ButtonComponent,
  AmountComponent,
  IconComponent,
  SkeletonComponent,
  CategoryBadgeComponent,
  ListRowComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  PaginationComponent,
  FormFieldComponent,
  CurrencyInputComponent,
  CategoryPickerComponent,
  DialogShellComponent,
  ActionSheetComponent,
  UiDialogService,
} from '../../shared/ui';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DatePipe,
    ButtonComponent,
    AmountComponent,
    IconComponent,
    SkeletonComponent,
    CategoryBadgeComponent,
    ListRowComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    FormFieldComponent,
    CurrencyInputComponent,
    CategoryPickerComponent,
    DialogShellComponent,
    ActionSheetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <ui-page-header
        [title]="ts.t()('nav.expenses')"
        [subtitle]="ts.t()('trans.expenses_subtitle')"
      >
        <div uiHeaderActions class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <!-- Date Filter -->
          <div class="relative">
            <button
              type="button"
              (click)="toggleMonthPicker()"
              class="h-9 px-3 bg-surface border border-border rounded-lg text-xs md:text-sm font-medium text-ink hover:bg-surface-raised transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              [attr.aria-expanded]="isMonthPickerOpen()"
            >
              <ui-icon name="calendar_today" size="sm" class="text-ink-muted" />
              <span class="truncate max-w-[110px] md:max-w-none">{{ getDateFilterLabel() }}</span>
              <ui-icon
                name="expand_more"
                size="sm"
                class="text-ink-muted transition-transform"
                [class.rotate-180]="isMonthPickerOpen()"
              />
            </button>

            @if (isMonthPickerOpen()) {
              <div class="fixed inset-0 z-30" (click)="isMonthPickerOpen.set(false)"></div>
              <div
                class="absolute z-40 top-full left-0 mt-1.5 w-48 bg-surface-raised border border-border rounded-xl shadow-xl overflow-hidden py-1.5 animate-scale-in max-h-72 overflow-y-auto"
              >
                <button
                  type="button"
                  (click)="selectMonth(null, null)"
                  class="w-full text-left px-3.5 py-2 text-xs md:text-sm font-medium hover:bg-surface-sunken transition-colors flex items-center justify-between"
                  [class.text-accent]="!currentDateFilter()"
                  [class.font-semibold]="!currentDateFilter()"
                >
                  <span>{{ ts.t()('trans.all_time') }}</span>
                  @if (!currentDateFilter()) {
                    <ui-icon name="check" size="sm" class="text-accent" />
                  }
                </button>
                @for (m of getAvailableMonths(); track m.label) {
                  <button
                    type="button"
                    (click)="selectMonth(m.month, m.year)"
                    class="w-full text-left px-3.5 py-2 text-xs md:text-sm font-medium hover:bg-surface-sunken transition-colors flex items-center justify-between"
                    [class.text-accent]="
                      currentDateFilter()?.month === m.month && currentDateFilter()?.year === m.year
                    "
                    [class.font-semibold]="
                      currentDateFilter()?.month === m.month && currentDateFilter()?.year === m.year
                    "
                  >
                    <span>{{ m.label }}</span>
                    @if (
                      currentDateFilter()?.month === m.month && currentDateFilter()?.year === m.year
                    ) {
                      <ui-icon name="check" size="sm" class="text-accent" />
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Category Filter -->
          <div class="relative">
            <button
              type="button"
              (click)="toggleFilterDropdown()"
              class="h-9 px-3 bg-surface border border-border rounded-lg text-xs md:text-sm font-medium text-ink hover:bg-surface-raised transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              [attr.aria-expanded]="showFilterDropdown()"
            >
              <ui-icon name="filter_list" size="sm" class="text-ink-muted" />
              <span class="truncate max-w-[100px] md:max-w-none">{{ getFilterLabel() }}</span>
              <ui-icon
                name="expand_more"
                size="sm"
                class="text-ink-muted transition-transform"
                [class.rotate-180]="showFilterDropdown()"
              />
            </button>

            @if (showFilterDropdown()) {
              <div class="fixed inset-0 z-30" (click)="showFilterDropdown.set(false)"></div>
              <div
                class="absolute z-40 top-full right-0 mt-1.5 w-56 bg-surface-raised border border-border rounded-xl shadow-xl overflow-hidden py-1.5 animate-scale-in max-h-80 overflow-y-auto"
              >
                <button
                  type="button"
                  (click)="applyFilter(null)"
                  class="w-full text-left px-3.5 py-2 text-xs md:text-sm font-medium hover:bg-surface-sunken transition-colors flex items-center justify-between"
                  [class.text-accent]="!currentFilter()"
                  [class.font-semibold]="!currentFilter()"
                >
                  <div class="flex items-center gap-2">
                    <ui-icon name="apps" size="sm" class="text-ink-muted" />
                    <span>{{ ts.t()('trans.all_categories') }}</span>
                  </div>
                  @if (!currentFilter()) {
                    <ui-icon name="check" size="sm" class="text-accent" />
                  }
                </button>
                @for (cat of categories(); track cat.id) {
                  <button
                    type="button"
                    (click)="applyFilter(cat)"
                    class="w-full text-left px-3.5 py-2 text-xs md:text-sm font-medium hover:bg-surface-sunken transition-colors flex items-center justify-between"
                    [class.text-accent]="currentFilter() === cat.id"
                    [class.font-semibold]="currentFilter() === cat.id"
                  >
                    <div class="flex items-center gap-2.5 truncate">
                      <span
                        class="w-5 h-5 rounded flex items-center justify-center text-xs shrink-0"
                        [style.backgroundColor]="cat.color + '25'"
                        [style.color]="cat.color"
                      >
                        <ui-icon [name]="cat.icons" size="sm" />
                      </span>
                      <span class="truncate">{{ ts.translateCategory(cat.name) }}</span>
                    </div>
                    @if (currentFilter() === cat.id) {
                      <ui-icon name="check" size="sm" class="text-accent" />
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Add Expense Button -->
          <button
            uiButton
            variant="primary"
            size="sm"
            type="button"
            (click)="openModal()"
            class="h-9 whitespace-nowrap"
          >
            <ui-icon name="add" size="sm" class="mr-1" />
            <span>{{ ts.t()('trans.add_expense') }}</span>
          </button>
        </div>
      </ui-page-header>

      <!-- Sub-Tabs: Incomes / Expenses Switch -->
      <div
        class="flex items-center gap-1 bg-surface-raised border border-border p-1 rounded-xl w-fit"
      >
        <a
          routerLink="/incomes"
          class="px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors text-ink-muted hover:text-ink hover:bg-surface"
        >
          {{ ts.t()('nav.incomes') }}
        </a>
        <a
          routerLink="/expenses"
          class="px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors bg-surface text-accent shadow-sm border border-border/50"
        >
          {{ ts.t()('nav.expenses') }}
        </a>
      </div>

      <!-- Main Expenses List / Table -->
      @if (isLoading() && expenses().length === 0) {
        <!-- Skeleton Loading State -->
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div
              class="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-4"
            >
              <div class="flex items-center gap-3 flex-1">
                <ui-skeleton shape="circle" customClass="w-9 h-9" />
                <div class="space-y-1.5 flex-1 max-w-xs">
                  <ui-skeleton shape="line" customClass="h-4 w-3/4" />
                  <ui-skeleton shape="line" customClass="h-3 w-1/2" />
                </div>
              </div>
              <ui-skeleton shape="line" customClass="h-5 w-24" />
            </div>
          }
        </div>
      } @else if (expenses().length === 0) {
        <!-- Empty State -->
        <ui-empty-state
          icon="receipt_long"
          [title]="ts.t()('trans.empty_expenses_title')"
          [description]="ts.t()('trans.empty_expenses_desc')"
        >
          <button
            uiButton
            variant="primary"
            uiEmptyAction
            type="button"
            (click)="openModal()"
          >
            <ui-icon name="add" size="sm" class="mr-1" />
            <span>{{ ts.t()('trans.add_expense') }}</span>
          </button>
        </ui-empty-state>
      } @else {
        <!-- Mobile List View (md:hidden) -->
        <div class="md:hidden space-y-2">
          @for (item of expenses(); track item.id) {
            <ui-list-row [interactive]="true" (rowClick)="openActionMenu(item)">
              <div uiRowLeading class="flex items-center justify-center">
                <ui-category-badge
                  [name]="ts.translateCategory(item.category.name) || ts.t()('trans.general')"
                  [icon]="item.category.icons"
                  [color]="item.category.color"
                  size="sm"
                />
              </div>
              <div class="min-w-0 pr-2">
                <p class="font-medium text-sm text-ink truncate">{{ item.description }}</p>
                <p class="text-xs text-ink-muted mt-0.5">{{ item.date | date: 'mediumDate' }}</p>
              </div>
              <div uiRowTrailing class="text-right">
                <ui-amount [value]="item.amount" tone="expense" size="sm" />
              </div>
            </ui-list-row>
          }
        </div>

        <!-- Desktop Table View (hidden md:block) -->
        <div
          class="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          <table class="w-full text-left table-fixed border-collapse">
            <thead
              class="bg-surface-raised border-b border-border text-ink-muted text-xs font-semibold uppercase tracking-wider"
            >
              <tr>
                <th class="py-3.5 px-4 w-5/12">{{ ts.t()('trans.desc') }}</th>
                <th class="py-3.5 px-4 w-2/12">{{ ts.t()('trans.category') }}</th>
                <th class="py-3.5 px-4 w-2/12">{{ ts.t()('trans.date') }}</th>
                <th class="py-3.5 px-4 text-right w-2/12">{{ ts.t()('trans.amount') }}</th>
                <th class="py-3.5 px-4 text-center w-1/12">{{ ts.t()('trans.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (item of expenses(); track item.id) {
                <tr class="hover:bg-surface-raised/60 transition-colors">
                  <td class="py-3.5 px-4 text-ink font-medium">
                    <span class="truncate block max-w-full" [title]="item.description">
                      {{ item.description }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">
                    <ui-category-badge
                      [name]="ts.translateCategory(item.category.name) || ts.t()('trans.general')"
                      [icon]="item.category.icons"
                      [color]="item.category.color"
                      size="sm"
                    />
                  </td>
                  <td class="py-3.5 px-4 text-ink-muted text-sm tabular-nums">
                    {{ item.date | date: 'mediumDate' }}
                  </td>
                  <td class="py-3.5 px-4 text-right font-medium">
                    <ui-amount [value]="item.amount" tone="expense" size="sm" />
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        uiButton
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0"
                        (click)="openModal(item)"
                        [attr.aria-label]="ts.t()('trans.edit')"
                        [title]="ts.t()('trans.edit')"
                      >
                        <ui-icon name="edit" size="sm" class="text-ink-muted hover:text-accent" />
                      </button>
                      <button
                        type="button"
                        uiButton
                        variant="ghost"
                        size="sm"
                        class="h-8 w-8 p-0"
                        (click)="deleteItem(item)"
                        [attr.aria-label]="ts.t()('trans.delete')"
                        [title]="ts.t()('trans.delete')"
                      >
                        <ui-icon
                          name="delete"
                          size="sm"
                          class="text-ink-muted hover:text-expense"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        @if (totalPages() > 1) {
          <div class="pt-2">
            <ui-pagination
              [page]="currentPage()"
              [totalPages]="totalPages()"
              [prevLabel]="ts.t()('trans.prev')"
              [nextLabel]="ts.t()('trans.next')"
              (pageChange)="onPageChange($event)"
            />
          </div>
        }
      }
    </div>

    <!-- Add / Edit Modal -->
    @if (showModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        (click)="closeModal()"
      >
        <div class="w-full max-w-lg" (click)="$event.stopPropagation()">
          <ui-dialog-shell
            [title]="editingId() ? ts.t()('trans.edit_expense') : ts.t()('trans.add_expense')"
            [closeLabel]="ts.t()('trans.cancel')"
            (closed)="closeModal()"
          >
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <ui-form-field [label]="ts.t()('trans.desc')" fieldId="expense-desc">
                <input
                  id="expense-desc"
                  formControlName="description"
                  type="text"
                  class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                  placeholder="e.g. Supermarket, Services, etc."
                />
              </ui-form-field>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ui-form-field [label]="ts.t()('trans.amount')" fieldId="expense-amount">
                  <ui-currency-input inputId="expense-amount" formControlName="amount" />
                </ui-form-field>

                <ui-form-field [label]="ts.t()('trans.date')" fieldId="expense-date">
                  <input
                    id="expense-date"
                    formControlName="date"
                    type="date"
                    class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent dark:[color-scheme:dark]"
                  />
                </ui-form-field>
              </div>

              <ui-form-field [label]="ts.t()('trans.category')" fieldId="expense-category">
                <ui-category-picker
                  [categories]="categories()"
                  [placeholder]="ts.t()('trans.select_category')"
                  formControlName="categoryId"
                />
              </ui-form-field>

              <div uiDialogFooter class="flex items-center justify-end gap-2.5">
                <button type="button" uiButton variant="secondary" (click)="closeModal()">
                  {{ ts.t()('trans.cancel') }}
                </button>
                <button type="submit" uiButton variant="primary" [disabled]="form.invalid">
                  {{ editingId() ? ts.t()('trans.update') : ts.t()('trans.save') }}
                </button>
              </div>
            </form>
          </ui-dialog-shell>
        </div>
      </div>
    }

    <!-- Mobile Action Menu (Bottom Sheet) -->
    @if (showActionMenu()) {
      <div
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4 animate-fade-in"
        (click)="closeActionMenu()"
      >
        <div class="w-full max-w-md" (click)="$event.stopPropagation()">
          <ui-action-sheet
            [title]="actionMenuItem()?.description"
            [closeLabel]="ts.t()('trans.cancel')"
            (closed)="closeActionMenu()"
          >
            <div class="space-y-2">
              <button
                type="button"
                uiButton
                variant="secondary"
                class="w-full justify-start text-left"
                (click)="onEditFromMenu()"
              >
                <ui-icon name="edit" size="sm" class="mr-2 text-accent" />
                <span>{{ ts.t()('trans.edit') }}</span>
              </button>

              <button
                type="button"
                uiButton
                variant="danger"
                class="w-full justify-start text-left"
                (click)="onDeleteFromMenu()"
              >
                <ui-icon name="delete" size="sm" class="mr-2" />
                <span>{{ ts.t()('trans.delete') }}</span>
              </button>
            </div>
          </ui-action-sheet>
        </div>
      </div>
    }
  `,
})
export class ExpensesComponent implements OnInit, OnDestroy {
  // Injections
  state = inject(ExpenseStateService);
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  public ts = inject(TranslationService);
  private ns = inject(NotificationService);
  private dialogService = inject(UiDialogService);
  private route = inject(ActivatedRoute);

  // UI State
  categories = signal<Category[]>([]);
  pageSize = signal(6);

  // State Signals
  expenses = this.state.expenses;
  isLoading = this.state.isLoading;
  totalItems = this.state.totalElements;
  totalPages = this.state.totalPages;
  currentPage = this.state.currentPage;

  // Filter Signals
  showFilterDropdown = signal(false);
  currentFilter = this.state.categoryFilter;
  isMonthPickerOpen = signal(false);
  currentDateFilter = this.state.dateFilter;

  // Modal & Sheet Signals
  showModal = signal(false);
  editingId = signal<number | null>(null);
  showActionMenu = signal(false);
  actionMenuItem = signal<ExpenseResponse | null>(null);

  form: FormGroup;
  private refreshSubscription: Subscription | null = null;

  constructor() {
    this.form = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      currency: ['DOP'],
      categoryId: [null as number | null, Validators.required],
    });
  }

  ngOnInit() {
    const qp = this.route.snapshot.queryParams;
    if (qp['category']) {
      const catId = Number(qp['category']);
      if (!isNaN(catId)) {
        this.state.setFilter(catId);
      }
    }
    if (qp['month'] && qp['year']) {
      const month = Number(qp['month']);
      const year = Number(qp['year']);
      if (!isNaN(month) && !isNaN(year)) {
        this.state.setDateFilter(month, year);
      }
    }

    this.state.refresh();
    this.loadCategories();

    // Poll every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.state.refresh();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
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

  // Filter Helpers
  toggleFilterDropdown() {
    this.showFilterDropdown.update((v) => !v);
  }

  applyFilter(category: Category | null) {
    this.state.setFilter(category ? category.id : null);
    this.showFilterDropdown.set(false);
  }

  getFilterLabel(): string {
    const id = this.currentFilter();
    if (!id) return this.ts.t()('trans.all_categories');
    const cat = this.categories().find((c) => c.id === id);
    return cat ? this.ts.translateCategory(cat.name) : this.ts.t()('trans.category');
  }

  toggleMonthPicker() {
    this.isMonthPickerOpen.update((v) => !v);
  }

  selectMonth(month: number | null, year: number | null) {
    this.state.setDateFilter(month, year);
    this.isMonthPickerOpen.set(false);
  }

  getDateFilterLabel(): string {
    const filter = this.currentDateFilter();
    if (!filter) return this.ts.t()('trans.all_time');
    const date = new Date(filter.year, filter.month - 1);
    const loc = this.ts.currentLang() === 'es' ? 'es-DO' : 'en-US';
    return new Intl.DateTimeFormat(loc, { month: 'short', year: 'numeric' }).format(date);
  }

  getAvailableMonths(): { month: number; year: number; label: string }[] {
    const dates = [];
    const today = new Date();
    const loc = this.ts.currentLang() === 'es' ? 'es-DO' : 'en-US';
    for (let i = 0; i < 13; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      dates.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(d),
      });
    }
    return dates;
  }

  // Pagination
  onPageChange(page: number) {
    this.state.load(page, this.pageSize());
  }

  // Action Menu (Mobile Sheet)
  openActionMenu(item: ExpenseResponse) {
    this.actionMenuItem.set(item);
    this.showActionMenu.set(true);
  }

  closeActionMenu() {
    this.showActionMenu.set(false);
    this.actionMenuItem.set(null);
  }

  onEditFromMenu() {
    const item = this.actionMenuItem();
    this.closeActionMenu();
    if (item) this.openModal(item);
  }

  onDeleteFromMenu() {
    const item = this.actionMenuItem();
    this.closeActionMenu();
    if (item) this.deleteItem(item);
  }

  // Add / Edit Modal
  openModal(itemToEdit: ExpenseResponse | null = null) {
    if (itemToEdit) {
      this.editingId.set(itemToEdit.id);
      this.form.patchValue({
        description: itemToEdit.description,
        amount: itemToEdit.amount,
        date: new Date(itemToEdit.date).toISOString().split('T')[0],
        currency: 'DOP',
        categoryId: itemToEdit.category?.id ?? null,
      });
    } else {
      this.editingId.set(null);
      this.form.reset({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        currency: 'DOP',
        categoryId: null,
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
      const id = this.editingId();
      const payload = { ...formData, categoryId: Number(formData.categoryId) };

      // Optimistic Close
      this.closeModal();

      let obs$;
      if (id) {
        const selectedCat = this.categories().find((c) => c.id === payload.categoryId);
        obs$ = this.state.update(id, payload, selectedCat);
      } else {
        obs$ = this.state.add(payload);
      }

      obs$.subscribe({
        next: () => {
          const isEdit = !!id;
          const msg = isEdit ? 'notif.expense_updated' : 'notif.expense_created';
          this.ns.show(msg, 'success');
        },
        error: (err) => {
          console.error('Operation failed', err);
          this.ns.show(err.error?.message || 'Operation failed', 'error');
        },
      });
    }
  }

  async deleteItem(item: ExpenseResponse) {
    const confirmed = await this.dialogService.confirm({
      title: this.ts.t()('trans.delete_title'),
      message: this.ts.t()('trans.delete_msg'),
      confirmLabel: this.ts.t()('trans.delete'),
      cancelLabel: this.ts.t()('trans.cancel'),
      tone: 'danger',
    });

    if (confirmed) {
      this.state.delete(Number(item.id)).subscribe({
        next: () => {
          this.ns.show('notif.expense_deleted', 'success');
        },
        error: (err) => {
          console.error('Error deleting expense', err);
          this.ns.show('notif.expense_delete_fail', 'error');
        },
      });
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showActionMenu()) {
        this.closeActionMenu();
        return;
      }
      if (this.showFilterDropdown()) {
        this.showFilterDropdown.set(false);
        return;
      }
      if (this.isMonthPickerOpen()) {
        this.isMonthPickerOpen.set(false);
        return;
      }
      if (this.showModal()) {
        this.closeModal();
      }
    } else if (event.key === 'Enter') {
      if (this.showModal() && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.onSubmit();
      }
    } else if ((event.altKey && event.key === 'n') || (event.altKey && event.key === 'N')) {
      if (!this.showModal()) {
        event.preventDefault();
        this.openModal();
      }
    }
  }
}
