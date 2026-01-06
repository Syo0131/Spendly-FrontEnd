import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 })),
      ]),
    ]),
  ],
  template: `
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div
        *ngFor="let toast of ns.toasts()"
        [@toastAnimation]
        class="pointer-events-auto min-w-[300px] max-w-sm rounded-xl shadow-lg border p-4 flex items-start gap-3 backdrop-blur-md"
        [ngClass]="{
          'bg-green-50/90 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200':
            toast.type === 'success',
          'bg-red-50/90 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200':
            toast.type === 'error',
          'bg-blue-50/90 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200':
            toast.type === 'info'
        }"
      >
        <!-- Icon -->
        <span class="material-icons-outlined text-xl mt-0.5">
          {{
            toast.type === 'success'
              ? 'check_circle'
              : toast.type === 'error'
              ? 'error_outline'
              : 'info'
          }}
        </span>

        <!-- Content -->
        <div class="flex-1">
          <p class="text-sm font-medium">{{ ts.translate(toast.message) }}</p>
          <button
            *ngIf="toast.action"
            (click)="toast.action.onClick()"
            class="mt-2 px-3 py-1 text-xs font-semibold rounded shadow-sm transition-colors border text-gray-800 bg-white hover:bg-gray-50 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {{ toast.action.label }}
          </button>
        </div>

        <!-- Close -->
        <button
          (click)="ns.dismissToast(toast.id)"
          class="opacity-60 hover:opacity-100 transition-opacity"
        >
          <span class="material-icons-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  `,
})
export class ToastComponent {
  constructor(public ns: NotificationService, public ts: TranslationService) {}
}
