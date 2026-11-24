import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { RemindersStateService } from '../../core/services/reminders-state.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  CreateRemindersDto,
  RemindersResponseDto,
} from '../../core/models/api.models';
import {
  ButtonComponent,
  AmountComponent,
  IconComponent,
  SkeletonComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  FormFieldComponent,
  CurrencyInputComponent,
  DialogShellComponent,
  PaginationComponent,
  UiDialogService,
} from '../../shared/ui';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    ButtonComponent,
    AmountComponent,
    IconComponent,
    SkeletonComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    FormFieldComponent,
    CurrencyInputComponent,
    DialogShellComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <ui-page-header
        [title]="ts.t()('reminders.title')"
        [subtitle]="ts.t()('reminders.desc')"
      >
        <button
          uiButton
          variant="primary"
          (click)="openModal()"
        >
          <ui-icon name="add" size="sm" class="mr-1.5" />
          {{ ts.t()('forms.add') }}
        </button>
      </ui-page-header>

      <!-- Loading State -->
      @if (state.isLoading() && !state.reminders().length) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (i of [1,2,3,4,5,6]; track i) {
        <div class="p-5 border border-border rounded-xl bg-surface-raised space-y-4">
          <div class="flex items-center gap-3">
            <ui-skeleton shape="circle" class="w-10 h-10" />
            <div class="flex-1 space-y-2">
              <ui-skeleton class="h-4 w-3/4" />
              <ui-skeleton class="h-3 w-1/2" />
            </div>
          </div>
          <div class="flex justify-between items-end pt-2 border-t border-border/50">
            <ui-skeleton class="h-3 w-24" />
            <ui-skeleton class="h-5 w-20" />
          </div>
        </div>
        }
      </div>
      }

      <!-- Empty State -->
      @if (!state.isLoading() && !state.reminders().length) {
      <ui-empty-state
        icon="notifications_off"
        [title]="ts.t()('reminders.empty_title')"
        [description]="ts.t()('reminders.empty_desc')"
      >
        <button
          uiEmptyAction
          uiButton
          variant="primary"
          (click)="openModal()"
        >
          <ui-icon name="add" size="sm" class="mr-1.5" />
          {{ ts.t()('forms.add') }}
        </button>
      </ui-empty-state>
      }

      <!-- List -->
      @if (state.reminders().length > 0) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (item of state.reminders(); track item.id) {
        <div
          class="bg-surface-raised border border-border hover:border-lime-500/40 transition-colors rounded-xl p-5 shadow-sm flex flex-col justify-between group"
        >
          <!-- Card Content -->
          <div>
            <div class="flex justify-between items-start gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center shrink-0 border border-border text-ink"
                >
                  <ui-icon name="campaign" size="md" />
                </div>
                <div class="min-w-0">
                  <h3
                    class="text-sm font-semibold text-ink leading-tight truncate"
                    [title]="item.title"
                  >
                    {{ item.title }}
                  </h3>
                  <p
                    class="text-xs text-ink-muted line-clamp-2 mt-0.5"
                    [title]="item.message"
                  >
                    {{ item.message }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  uiButton
                  variant="ghost"
                  size="sm"
                  class="!p-1.5 text-ink-muted hover:text-ink"
                  (click)="edit(item)"
                  [title]="ts.t()('trans.edit')"
                  [attr.aria-label]="ts.t()('trans.edit')"
                >
                  <ui-icon name="edit" size="sm" />
                </button>
                <button
                  uiButton
                  variant="ghost"
                  size="sm"
                  class="!p-1.5 text-ink-muted hover:text-expense"
                  (click)="confirmDelete(item)"
                  [title]="ts.t()('trans.delete')"
                  [attr.aria-label]="ts.t()('trans.delete')"
                >
                  <ui-icon name="delete" size="sm" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-end mt-4 pt-3 border-t border-border/50 text-xs text-ink-muted">
            <div>
              <span class="block text-[10px] uppercase font-bold tracking-wider text-ink-muted/80">
                {{ ts.t()('trans.date') }}
              </span>
              <span class="font-medium text-ink">
                {{ item.remindAt | date : 'medium' }}
              </span>
            </div>

            @if (item.amount) {
            <div class="text-right">
              <ui-amount [value]="item.amount" currency="DOP" size="md" />
            </div>
            }
          </div>
        </div>
        }
      </div>

      @if (state.totalPages() > 1) {
      <div class="flex justify-center pt-4">
        <ui-pagination
          [page]="state.currentPage()"
          [totalPages]="state.totalPages()"
          (pageChange)="state.setPage($event)"
        />
      </div>
      }
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      (click)="closeModal()"
    >
      <div class="w-full max-w-lg" (click)="$event.stopPropagation()">
        <ui-dialog-shell
          [title]="isEditing() ? ts.t()('trans.edit') : ts.t()('reminders.new_title')"
          [closeLabel]="ts.t()('action.cancel')"
          (closed)="closeModal()"
        >
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <!-- Title -->
            <ui-form-field fieldId="reminder-title" [label]="ts.t()('trans.title')">
              <input
                id="reminder-title"
                type="text"
                formControlName="title"
                class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50"
                [placeholder]="ts.t()('trans.title')"
              />
            </ui-form-field>

            <!-- Message -->
            <ui-form-field fieldId="reminder-desc" [label]="ts.t()('trans.desc')">
              <input
                id="reminder-desc"
                type="text"
                formControlName="message"
                class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent placeholder-ink-muted/50"
                [placeholder]="ts.t()('trans.desc')"
              />
            </ui-form-field>

            <!-- Amount -->
            <ui-form-field fieldId="reminder-amount" [label]="ts.t()('trans.amount')">
              <ui-currency-input
                inputId="reminder-amount"
                formControlName="amount"
              />
            </ui-form-field>

            <!-- Date -->
            <ui-form-field fieldId="reminder-date" [label]="ts.t()('trans.date')">
              <input
                id="reminder-date"
                type="datetime-local"
                formControlName="remindAt"
                class="w-full bg-surface-sunken border border-border text-ink text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
              />
            </ui-form-field>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                uiButton
                variant="secondary"
                type="button"
                (click)="closeModal()"
              >
                {{ ts.t()('action.cancel') }}
              </button>
              <button
                uiButton
                variant="primary"
                type="submit"
                [disabled]="form.invalid || state.isLoading()"
              >
                <ui-icon name="check" size="sm" class="mr-1.5" />
                {{ isEditing() ? ts.t()('action.save') : ts.t()('forms.add') }}
              </button>
            </div>
          </form>
        </ui-dialog-shell>
      </div>
    </div>
    }
  `,
})
export class RemindersComponent {
  state = inject(RemindersStateService);
  ts = inject(TranslationService);
  fb = inject(FormBuilder);
  ns = inject(NotificationService);
  dialogService = inject(UiDialogService);

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(3)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    remindAt: ['', [Validators.required]],
  });

  openModal() {
    this.showModal.set(true);
    this.isEditing.set(false);
    this.editingId.set(null);
    const tomorrow = new Date(Date.now() + 86400000);
    this.form.reset({
      remindAt: tomorrow.toISOString().slice(0, 16),
      amount: null,
      title: '',
      message: '',
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  edit(item: RemindersResponseDto) {
    this.isEditing.set(true);
    this.editingId.set(item.id);
    this.showModal.set(true);

    let dateStr = '';
    if (item.remindAt) {
      dateStr = new Date(item.remindAt).toISOString().slice(0, 16);
    }

    this.form.patchValue({
      title: item.title,
      message: item.message,
      amount: item.amount,
      remindAt: dateStr,
    });
  }

  async submit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const payload: CreateRemindersDto = {
      title: val.title,
      message: val.message,
      amount: Number(val.amount),
      remindAt: val.remindAt.length === 16 ? val.remindAt + ':00' : val.remindAt,
    };

    const isEdit = this.isEditing();
    const editId = this.editingId();

    this.closeModal();

    try {
      if (isEdit && editId !== null) {
        await this.state.update(editId, payload);
        this.ns.show(this.ts.translate('reminders.updated'), 'success');
      } else {
        await this.state.add(payload);
        this.ns.show(this.ts.translate('reminders.created'), 'success');
      }
    } catch {
      this.ns.show(
        this.ts.translate(isEdit ? 'reminders.fail_update' : 'reminders.fail_create'),
        'error'
      );
    }
  }

  async confirmDelete(item: RemindersResponseDto) {
    const confirmed = await this.dialogService.confirm({
      title: this.ts.t()('reminders.delete_title'),
      message: `${this.ts.t()('reminders.delete_confirm')} "${item.title}"?`,
      confirmLabel: this.ts.t()('trans.delete'),
      cancelLabel: this.ts.t()('action.cancel'),
      tone: 'danger',
    });

    if (confirmed) {
      try {
        await this.state.delete(item.id);
        this.ns.show(this.ts.translate('reminders.deleted'), 'success');
      } catch {
        this.ns.show(this.ts.translate('reminders.fail_delete'), 'error');
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showModal()) {
        this.closeModal();
      }
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      if (this.showModal() && this.form.valid && !this.state.isLoading()) {
        event.preventDefault();
        this.submit();
      }
    } else if (event.altKey && (event.key === 'n' || event.key === 'N')) {
      if (!this.showModal()) {
        event.preventDefault();
        this.openModal();
      }
    }
  }
}
