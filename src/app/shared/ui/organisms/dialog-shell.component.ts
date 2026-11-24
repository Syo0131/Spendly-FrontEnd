import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../atoms/icon.component';

@Component({
  selector: 'ui-dialog-shell',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title()"
      class="w-full bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Dialog Header -->
      <div class="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0 bg-surface-raised">
        <h3 class="font-bold text-base text-ink tracking-tight">{{ title() }}</h3>
        <button
          type="button"
          (click)="closed.emit()"
          [attr.aria-label]="closeLabel()"
          class="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <ui-icon name="close" size="sm" />
        </button>
      </div>

      <!-- Dialog Body -->
      <div class="p-6 overflow-y-auto flex-1 text-ink text-sm space-y-4">
        <ng-content />
      </div>

      <!-- Optional Dialog Footer -->
      <div class="px-6 py-3 border-t border-border bg-surface-raised flex items-center justify-end gap-3 flex-shrink-0 empty:hidden">
        <ng-content select="[uiDialogFooter]" />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DialogShellComponent {
  title = input.required<string>();
  closeLabel = input.required<string>();
  closed = output<void>();
}
