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
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';
import { IncomeStateService } from '../../core/services/income-state.service';
import { IncomeResponse } from '../../core/models/api.models';
import {
  ButtonComponent,
  AmountComponent,
  IconComponent,
  SkeletonComponent,
  ListRowComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  PaginationComponent,
  FormFieldComponent,
  CurrencyInputComponent,
  DialogShellComponent,
  ActionSheetComponent,
  UiDialogService,
} from '../../shared/ui';

@Component({
  selector: 'app-incomes',
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
    ListRowComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    PaginationComponent,
    FormFieldComponent,
    CurrencyInputComponent,
    DialogShellComponent,
    ActionSheetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <ui-page-header
        [title]="ts.t()('nav.incomes')"
        [subtitle]="ts.t()('trans.incomes_subtitle')"
      >
        <div uiHeaderActions class="flex items-center gap-2">
          <!-- Add Income Button -->
          <button
            uiButton
            variant="primary"
            size="sm"
            type="button"
            (click)="openModal()"
            class="h-9 whitespace-nowrap"
          >
            <ui-icon name="add" size="sm" class="mr-1" />
            <span>{{ ts.t()('trans.add_income') }}</span>
          </button>
        </div>
      </ui-page-header>

      <!-- Sub-Tabs: Incomes / Expenses Switch -->
      <div
        class="flex items-center gap-1 bg-surface-raised border border-border p-1 rounded-xl w-fit"
      >
        <a
          routerLink="/incomes"
          class="px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors bg-surface text-accent shadow-sm border border-border/50"
        >
          {{ ts.t()('nav.incomes') }}
        </a>
        <a
          routerLink="/expenses"
          class="px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors text-ink-muted hover:text-ink hover:bg-surface"
        >
          {{ ts.t()('nav.expenses') }}
        </a>
      </div>

      <!-- Main Incomes List / Table -->
      @if (isLoading() && incomes().length === 0) {
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
      } @else if (incomes().length === 0) {
        <!-- Empty State -->
        <ui-empty-state
          icon="account_balance_wallet"
          [title]="ts.t()('trans.empty_incomes_title')"
          [description]="ts.t()('trans.empty_incomes_desc')"
        >
          <button
            uiButton
            variant="primary"
            uiEmptyAction
            type="button"
            (click)="openModal()"
          >
            <ui-icon name="add" size="sm" class="mr-1" />
            <span>{{ ts.t()('trans.add_income') }}</span>
          </button>
        </ui-empty-state>
      } @else {
        <!-- Mobile List View (md:hidden) -->
        <div class="md:hidden space-y-2">
          @for (item of incomes(); track item.id) {
            <ui-list-row [interactive]="true" (rowClick)="openActionMenu(item)">
              <div uiRowLeading class="flex items-center justify-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center bg-income/10 text-income"
                >
                  <ui-icon name="trending_up" size="sm" />
                </div>
              </div>
              <div class="min-w-0 pr-2">
                <p class="font-medium text-sm text-ink truncate">{{ item.description }}</p>
                <p class="text-xs text-ink-muted mt-0.5">{{ item.date | date: 'mediumDate' }}</p>
              </div>
              <div uiRowTrailing class="text-right">
                <ui-amount [value]="item.amount" tone="income" size="sm" />
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
                <th class="py-3.5 px-4 w-6/12">{{ ts.t()('trans.desc') }}</th>
                <th class="py-3.5 px-4 w-3/12">{{ ts.t()('trans.date') }}</th>
                <th class="py-3.5 px-4 text-right w-2/12">{{ ts.t()('trans.amount') }}</th>
                <th class="py-3.5 px-4 text-center w-1/12">{{ ts.t()('trans.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (item of incomes(); track item.id) {
                <tr class="hover:bg-surface-raised/60 transition-colors">
                  <td class="py-3.5 px-4 text-ink font-medium">
                    <span class="truncate block max-w-full" [title]="item.description">
                      {{ item.description }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-ink-muted text-sm tabular-nums">
                    {{ item.date | date: 'mediumDate' }}
                  </td>
                  <td class="py-3.5 px-4 text-right font-medium">
                    <ui-amount [value]="item.amount" tone="income" size="sm" />
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
            [title]="editingId() ? ts.t()('trans.edit_income') : ts.t()('trans.add_income')"
            [closeLabel]="ts.t()('trans.cancel')"
            (closed)="closeModal()"
          >
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <ui-form-field [label]="ts.t()('trans.desc')" fieldId="income-desc">
                <input
                  id="income-desc"
                  formControlName="description"
                  type="text"
                  class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent"
                  placeholder="e.g. Salary, Freelance, Dividend, etc."
                />
              </ui-form-field>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ui-form-field [label]="ts.t()('trans.amount')" fieldId="income-amount">
                  <ui-currency-input inputId="income-amount" formControlName="amount" />
                </ui-form-field>

                <ui-form-field [label]="ts.t()('trans.date')" fieldId="income-date">
                  <input
                    id="income-date"
                    formControlName="date"
                    type="date"
                    class="w-full h-10 px-3 bg-surface border border-border text-ink text-sm rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent dark:[color-scheme:dark]"
                  />
                </ui-form-field>
              </div>

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
export class IncomesComponent implements OnInit, OnDestroy {
  // Injections
  state = inject(IncomeStateService);
  private fb = inject(FormBuilder);
  public ts = inject(TranslationService);
  private ns = inject(NotificationService);
  private dialogService = inject(UiDialogService);

  // UI State
  pageSize = signal(6);

  // State Signals
  incomes = this.state.incomes;
  isLoading = this.state.isLoading;
  totalItems = this.state.totalElements;
  totalPages = this.state.totalPages;
  currentPage = this.state.currentPage;

  // Modal & Sheet Signals
  showModal = signal(false);
  editingId = signal<number | null>(null);
  showActionMenu = signal(false);
  actionMenuItem = signal<IncomeResponse | null>(null);

  form: FormGroup;
  private refreshSubscription: Subscription | null = null;

  constructor() {
    this.form = this.fb.group({
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      currency: ['DOP'],
    });
  }

  ngOnInit() {
    this.state.refresh();

    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => this.state.refresh());
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // Pagination
  onPageChange(page: number) {
    this.state.load(page, this.pageSize());
  }

  // Action Menu (Mobile Sheet)
  openActionMenu(item: IncomeResponse) {
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
  openModal(itemToEdit: IncomeResponse | null = null) {
    if (itemToEdit) {
      this.editingId.set(itemToEdit.id);
      this.form.patchValue({
        description: itemToEdit.description,
        amount: itemToEdit.amount,
        date: new Date(itemToEdit.date).toISOString().split('T')[0],
        currency: 'DOP',
      });
    } else {
      this.editingId.set(null);
      this.form.reset({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        currency: 'DOP',
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
      const payload = { ...formData };

      // Optimistic Close
      this.closeModal();

      const obs$ = id ? this.state.update(id, payload) : this.state.add(payload);

      obs$.subscribe({
        next: () => {
          const msg = id ? 'notif.income_updated' : 'notif.income_created';
          this.ns.show(msg, 'success');
        },
        error: (err) => {
          console.error('Operation failed', err);
          this.ns.show(err.error?.message || 'notif.operation_failed', 'error');
        },
      });
    }
  }

  async deleteItem(item: IncomeResponse) {
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
          this.ns.show('notif.income_deleted', 'success');
        },
        error: () => {
          this.ns.show('notif.income_delete_fail', 'error');
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
