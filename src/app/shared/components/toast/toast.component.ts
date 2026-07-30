import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass, IconComponent],
  template: `
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      @for (toast of ns.toasts(); track toast.id) {
      <div
        class="animate-slide-in-up pointer-events-auto min-w-[300px] max-w-sm rounded-xl shadow-lg border p-4 flex items-start gap-3 bg-surface-2 text-content"
        [ngClass]="{
          'border-success/30': toast.type === 'success',
          'border-expense/30': toast.type === 'error',
          'border-primary/30': toast.type === 'info'
        }"
      >
        <!-- Icon -->
        <app-icon
          class="mt-0.5 shrink-0"
          [size]="20"
          [ngClass]="{
            'text-success': toast.type === 'success',
            'text-expense': toast.type === 'error',
            'text-primary-ink': toast.type === 'info'
          }"
          [name]="
            toast.type === 'success'
              ? 'check_circle'
              : toast.type === 'error'
              ? 'error_outline'
              : 'info'
          "
        />

        <!-- Content -->
        <div class="flex-1">
          <p class="text-sm font-medium">{{ ts.translate(toast.message) }}</p>
          @if (toast.action) {
          <button
            (click)="toast.action.onClick()"
            class="mt-2 px-3 py-1 text-xs font-semibold rounded-lg border border-divider bg-surface-3 text-content hover:bg-divider transition-colors"
          >
            {{ toast.action.label }}
          </button>
          }
        </div>

        <!-- Close -->
        <button
          (click)="ns.dismissToast(toast.id)"
          class="opacity-60 hover:opacity-100 transition-opacity text-content-muted"
        >
          <app-icon name="close" [size]="16" />
        </button>
      </div>
      }
    </div>
  `,
})
export class ToastComponent {
  constructor(public ns: NotificationService, public ts: TranslationService) {}
}
