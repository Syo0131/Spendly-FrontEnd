import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed bottom-20 pb-safe lg:bottom-6 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2.5 pointer-events-none"
    >
      @for (toast of ns.toasts(); track toast.id) {
        <div
          role="status"
          class="pointer-events-auto min-w-[280px] max-w-sm rounded-xl shadow-xl border p-3.5 flex items-start gap-3 backdrop-blur-md transition-all"
          [ngClass]="{
            'bg-surface/95 border-emerald-500/30 text-ink': toast.type === 'success',
            'bg-surface/95 border-expense/30 text-ink': toast.type === 'error',
            'bg-surface/95 border-border text-ink': toast.type === 'info'
          }"
        >
          <!-- Semantic Icon -->
          <span
            class="material-icons-outlined text-xl mt-0.5 shrink-0 select-none"
            [ngClass]="{
              'text-emerald-500': toast.type === 'success',
              'text-expense': toast.type === 'error',
              'text-accent': toast.type === 'info'
            }"
          >
            {{
              toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'error'
                ? 'error_outline'
                : 'info'
            }}
          </span>

          <!-- Message & Action -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium leading-snug">{{ ts.translate(toast.message) }}</p>
            @if (toast.action) {
              <button
                type="button"
                (click)="toast.action.onClick()"
                class="mt-2 px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-surface-raised hover:bg-surface-sunken text-ink transition-colors"
              >
                {{ toast.action.label }}
              </button>
            }
          </div>

          <!-- Dismiss button -->
          <button
            type="button"
            (click)="ns.dismissToast(toast.id)"
            aria-label="Cerrar notificación"
            class="text-ink-muted hover:text-ink transition-colors p-1 -mr-1 -mt-1 rounded-md cursor-pointer"
          >
            <span class="material-icons-outlined text-base">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  constructor(public ns: NotificationService, public ts: TranslationService) {}
}
