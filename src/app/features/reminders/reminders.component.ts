import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslationService } from '../../core/services/translation.service';
import { RemindersStateService } from '../../core/services/reminders-state.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import {
  CreateRemindersDto,
  UpdateRemindersDto,
  RemindersResponseDto,
} from '../../core/models/api.models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { UiCardComponent } from '../../shared/components/ui/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui/ui-button.component';
import { UiEmptyStateComponent } from '../../shared/components/ui/ui-empty-state.component';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    UiCardComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
  ],
  template: `
    <div class="p-6 pb-24 md:pb-6 space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1
            class="text-xl md:text-3xl font-display font-semibold text-content tracking-tight flex items-center gap-3"
          >
            {{ ts.t()('reminders.title') }}
          </h1>
          <p class="text-sm text-content-muted mt-1 font-medium">
            {{ ts.t()('reminders.desc') }}
          </p>
        </div>
        <button
          (click)="openModal()"
          class="w-full md:w-auto px-3 py-1.5 md:px-6 md:py-3 bg-primary hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 font-semibold text-sm md:text-base tracking-wide"
        >
          <app-icon name="add_circle" [size]="20" class="mr-2" />
          {{ ts.t()('forms.add') }}
        </button>
      </div>

      <!-- Loading State -->
      @if (state.isLoading() && !state.reminders().length) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
        @for (i of [1,2,3]; track i) {
        <div
          class="p-5 border border-divider rounded-2xl bg-white/5 h-32"
        ></div>
        }
      </div>
      }

      <!-- Empty State -->
      @if (!state.isLoading() && !state.reminders().length) {
      <ui-card [padded]="false">
        <ui-empty-state
          icon="notifications_off"
          [title]="ts.t()('goals.empty_title')"
          [description]="ts.t()('goals.empty_desc')"
        >
          <ui-button (click)="openModal()">
            <app-icon name="add_circle" [size]="18" />
            {{ ts.t()('forms.add') }}
          </ui-button>
        </ui-empty-state>
      </ui-card>
      }

      <!-- List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (item of state.reminders(); track item.id) {
        <div
          class="glass-card p-4 md:p-5 border border-divider hover:shadow-xl hover:border-indigo-500/20 transition-all duration-300 rounded-2xl bg-surface-2 group"
        >
          <!-- Card Content -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 shadow-sm"
              >
                <app-icon name="campaign" [size]="24" class="text-primary" />
              </div>
              <div>
                <h3
                  class="text-sm md:text-base font-bold text-content leading-tight mb-1 line-clamp-1 break-all"
                >
                  {{ item.title }}
                </h3>
                <p class="text-xs text-content-muted line-clamp-1">
                  {{ item.message }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                (click)="edit(item)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-content-subtle hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              >
                <app-icon name="edit" [size]="20" />
              </button>
              <button
                (click)="delete(item.id)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-content-subtle hover:text-expense hover:bg-expense/10 transition-all"
              >
                <app-icon name="delete" [size]="20" />
              </button>
            </div>
          </div>

          <div class="flex justify-between items-end mt-4">
            <div>
              <p class="text-xs text-content-muted font-medium">
                {{ ts.t()('trans.date') }}
              </p>
              <p class="text-sm font-bold text-content">
                {{ item.remindAt | date : 'medium' }}
              </p>
            </div>

            @if (item.amount) {
            <span class="text-lg font-bold text-success">
              {{ item.amount | currency : 'DOP' : 'symbol' : '1.0-0' }}
            </span>
            }
          </div>
        </div>
        }
      </div>
    </div>

    <!-- Modal -->
    @if (showModal) {
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 px-4 sm:px-0 animate-fade-in"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>

      <!-- Dialog -->
      <div
        class="glass-card w-full max-w-md p-6 relative bg-surface-2 border border-divider shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl animate-scale-in"
      >
        <button
          (click)="closeModal()"
          class="absolute top-4 right-4 text-content-subtle hover:text-content transition-colors p-2 hover:bg-surface-3 rounded-full"
        >
          <app-icon name="close" [size]="20" />
        </button>

        <div class="text-center mb-6">
          <div
            class="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4"
          >
            <app-icon [name]="isEditing ? 'edit_notifications' : 'notification_add'" [size]="30" class="text-primary" />
          </div>
          <h2 class="text-xl font-bold text-content">
            {{ isEditing ? ts.t()('trans.edit') : ts.t()('goals.new_title') }}
          </h2>
          <p class="text-content-muted text-xs mt-1">{{ ts.t()('reminders.setup') }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <!-- Title -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.title') }}
            </label>
            <input
              type="text"
              formControlName="title"
              class="w-full bg-surface-3 border border-divider text-content text-sm font-semibold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-content-subtle"
              [placeholder]="ts.t()('trans.title')"
            />
          </div>

          <!-- Message -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.desc') }}
            </label>
            <input
              type="text"
              formControlName="message"
              class="w-full bg-surface-3 border border-divider text-content text-sm font-semibold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-content-subtle"
              [placeholder]="ts.t()('trans.desc')"
            />
          </div>

          <!-- Amount (Optional) -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.amount') }}
            </label>
            <div class="relative group">
              <span
                class="absolute left-4 top-3.5 text-content-muted font-bold text-lg"
                >$</span
              >
              <input
                type="number"
                formControlName="amount"
                class="w-full bg-surface-3 border border-divider text-content text-lg font-bold rounded-xl p-3 pl-8 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-content-subtle"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Date -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-content-muted uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.date') }}
            </label>
            <input
              type="datetime-local"
              formControlName="remindAt"
              class="w-full bg-surface-3 border border-divider text-content text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <!-- Actions -->
          <button
            type="submit"
            [disabled]="form.invalid || state.isLoading()"
            class="w-full bg-primary hover:bg-primary-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
          >
            <app-icon name="check" [size]="20" />
            {{ isEditing ? ts.t()('action.save') : ts.t()('forms.add') }}
          </button>
        </form>
      </div>
    </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [],
})
export class RemindersComponent {
  state = inject(RemindersStateService);
  ts = inject(TranslationService);
  fb = inject(FormBuilder);
  ns = inject(NotificationService);

  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(3)]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    remindAt: ['', [Validators.required]],
  });

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    const tomorrow = new Date(Date.now() + 86400000);
    this.form.reset({
      // Default to "tomorrow" same time if new
      remindAt: tomorrow.toISOString().slice(0, 16),
      amount: null,
      title: '',
      message: '',
    });
  }

  closeModal() {
    this.showModal = false;
    this.form.reset();
  }

  edit(item: RemindersResponseDto) {
    this.isEditing = true;
    this.editingId = item.id;
    this.showModal = true;
    // Format for datetime-local: YYYY-MM-DDTHH:mm
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

  submit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const payload = {
      title: val.title,
      message: val.message,
      amount: val.amount,
      remindAt: val.remindAt.length === 16 ? val.remindAt + ':00' : val.remindAt, // Ensure seconds are present, no Z or millis
    } as CreateRemindersDto;

    if (this.isEditing && this.editingId) {
      this.state
        .update(this.editingId, payload)
        .then(() => {
          this.ns.show(this.ts.translate('reminders.updated'), 'success');
          this.closeModal();
        })
        .catch((err: any) => {
          this.ns.show(this.ts.translate('reminders.fail_update'), 'error');
        });
    } else {
      this.state
        .add(payload)
        .then(() => {
          this.ns.show(this.ts.translate('reminders.created'), 'success');
          this.closeModal();
        })
        .catch((err: any) => {
          this.ns.show(this.ts.translate('reminders.fail_create'), 'error');
        });
    }
  }

  delete(id: number) {
    if (confirm(this.ts.translate('trans.delete_msg'))) {
      this.state
        .delete(id)
        .then(() => {
          this.ns.show(this.ts.translate('reminders.deleted'), 'success');
        })
        .catch((err: any) => {
          this.ns.show(this.ts.translate('reminders.fail_delete'), 'error');
        });
    }
  }
}
