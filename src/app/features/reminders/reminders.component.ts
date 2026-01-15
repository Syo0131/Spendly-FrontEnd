import { Component, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 pb-24 md:pb-6 space-y-6 animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1
            class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3"
          >
            {{ ts.t()('reminders.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {{ ts.t()('reminders.desc') }}
          </p>
        </div>
        <button
          (click)="openModal()"
          class="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-primary hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 font-semibold text-sm md:text-base tracking-wide"
        >
          <span class="material-icons-outlined mr-2 text-lg md:text-xl">add_circle</span>
          {{ ts.t()('forms.add') }}
        </button>
      </div>

      <!-- Loading State -->
      @if (state.isLoading() && !state.reminders().length) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
        @for (i of [1,2,3]; track i) {
        <div
          class="p-5 border border-gray-200 dark:border-white/5 rounded-2xl bg-white/5 h-32"
        ></div>
        }
      </div>
      }

      <!-- Empty State -->
      @if (!state.isLoading() && !state.reminders().length) {
      <div
        class="glass-card p-12 text-center border border-gray-200 dark:border-white/10 rounded-2xl"
      >
        <div
          class="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons-outlined text-3xl text-primary-300 dark:text-primary-600"
            >notifications_off</span
          >
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {{ ts.t()('goals.empty_title') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 text-sm">
          {{ ts.t()('goals.empty_desc') }}
        </p>
        <button
          (click)="openModal()"
          class="text-primary hover:text-primary-700 dark:text-primary-400 font-bold text-sm"
        >
          {{ ts.t()('forms.add') }}
        </button>
      </div>
      }

      <!-- List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (item of state.reminders(); track item.id) {
        <div
          class="glass-card p-5 border border-gray-100 dark:border-white/5 hover:shadow-xl hover:border-indigo-500/20 transition-all duration-300 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 group"
        >
          <!-- Card Content -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 shadow-sm"
              >
                <span class="material-icons-outlined text-primary">campaign</span>
              </div>
              <div>
                <h3
                  class="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-1 break-all"
                >
                  {{ item.title }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
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
                class="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              >
                <span class="material-icons-outlined text-lg">edit</span>
              </button>
              <button
                (click)="delete(item.id)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
              >
                <span class="material-icons-outlined text-lg">delete</span>
              </button>
            </div>
          </div>

          <div class="flex justify-between items-end mt-4">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {{ ts.t()('trans.date') }}
              </p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ item.remindAt | date : 'medium' }}
              </p>
            </div>

            @if (item.amount) {
            <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400">
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
        class="glass-card w-full max-w-md p-6 relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl animate-scale-in"
      >
        <button
          (click)="closeModal()"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
        >
          <span class="material-icons-outlined text-lg">close</span>
        </button>

        <div class="text-center mb-6">
          <div
            class="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4"
          >
            <span class="material-icons-outlined text-3xl text-primary">{{
              isEditing ? 'edit_notifications' : 'notification_add'
            }}</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ isEditing ? ts.t()('trans.edit') : ts.t()('goals.new_title') }}
          </h2>
          <p class="text-gray-500 text-xs mt-1">Set up your alert details</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
          <!-- Title -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.title') }}
            </label>
            <input
              type="text"
              formControlName="title"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
              [placeholder]="ts.t()('trans.title')"
            />
          </div>

          <!-- Message -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.desc') }}
            </label>
            <input
              type="text"
              formControlName="message"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
              [placeholder]="ts.t()('trans.desc')"
            />
          </div>

          <!-- Amount (Optional) -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.amount') }} (Optional)
            </label>
            <div class="relative group">
              <span
                class="absolute left-4 top-3.5 text-gray-500 dark:text-gray-400 font-bold text-lg"
                >$</span
              >
              <input
                type="number"
                formControlName="amount"
                class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-lg font-bold rounded-xl p-3 pl-8 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Date -->
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1"
            >
              {{ ts.t()('trans.date') }}
            </label>
            <input
              type="date"
              formControlName="remindAt"
              class="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-sm font-bold rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <!-- Actions -->
          <button
            type="submit"
            [disabled]="form.invalid || state.isLoading()"
            class="w-full bg-primary hover:bg-primary-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
          >
            <span class="material-icons-outlined text-lg">check</span>
            {{ isEditing ? ts.t()('action.save') : ts.t()('forms.add') }}
          </button>
        </form>
      </div>
    </div>
    }
  `,
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
    amount: [null],
    remindAt: ['', [Validators.required]],
  });

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.form.reset({
      // Default to "tomorrow"
      remindAt: tomorrow.toISOString().split('T')[0],
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
    // Extract YYYY-MM-DD from the timestamp or string
    let dateStr = '';
    if (item.remindAt) {
      // If it comes as full ISO, split it. If already YYYY-MM-DD, keep it.
      dateStr = item.remindAt.toString().split('T')[0];
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
      remindAt: val.remindAt, // Already YYYY-MM-DD from type="date"
    } as CreateRemindersDto;

    if (this.isEditing && this.editingId) {
      this.state
        .update(this.editingId, payload)
        .then(() => {
          this.ns.show('Reminder updated', 'success');
          this.closeModal();
        })
        .catch((err: any) => {
          this.ns.show('Failed to update reminder', 'error');
        });
    } else {
      this.state
        .add(payload)
        .then(() => {
          this.ns.show('Reminder created', 'success');
          this.closeModal();
        })
        .catch((err: any) => {
          this.ns.show('Failed to create reminder', 'error');
        });
    }
  }

  delete(id: number) {
    if (confirm(this.ts.translate('trans.delete_msg'))) {
      this.state
        .delete(id)
        .then(() => {
          this.ns.show('Reminder deleted', 'success');
        })
        .catch((err: any) => {
          this.ns.show('Failed to delete', 'error');
        });
    }
  }
}
