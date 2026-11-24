import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../atoms/icon.component';

@Component({
  selector: 'ui-action-sheet',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title() || 'Actions'"
      class="w-full bg-surface border-t lg:border border-border rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] lg:max-w-md mx-auto"
    >
      <!-- Grab handle on mobile -->
      <div class="pt-3 pb-1 flex justify-center lg:hidden">
        <div class="w-10 h-1 bg-ink-subtle/30 rounded-full"></div>
      </div>

      <!-- Optional Sheet Header -->
      @if (title()) {
        <div class="px-5 py-3 border-b border-border flex items-center justify-between bg-surface-raised flex-shrink-0">
          <h3 class="font-bold text-sm text-ink">{{ title() }}</h3>
          <button
            type="button"
            (click)="closed.emit()"
            [attr.aria-label]="closeLabel()"
            class="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
          >
            <ui-icon name="close" size="sm" />
          </button>
        </div>
      }

      <!-- Sheet Content -->
      <div class="p-5 overflow-y-auto flex-1 space-y-2">
        <ng-content />
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
export class ActionSheetComponent {
  title = input<string | undefined>(undefined);
  closeLabel = input<string>('Close');
  closed = output<void>();
}
