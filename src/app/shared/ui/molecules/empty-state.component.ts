import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../atoms/icon.component';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-border-subtle bg-surface-card/40 my-3"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-surface-muted/80 border border-border-subtle flex items-center justify-center text-fg-muted mb-4 shadow-sm"
      >
        <ui-icon [name]="icon()" size="lg" />
      </div>

      <h3 class="text-base sm:text-lg font-semibold text-fg-default tracking-tight">
        {{ title() }}
      </h3>

      @if (description()) {
        <p class="text-sm text-fg-muted max-w-sm mt-1.5 leading-relaxed">
          {{ description() }}
        </p>
      }

      <div class="mt-5 empty:hidden">
        <ng-content select="[uiEmptyAction]" />
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
export class EmptyStateComponent {
  icon = input.required<string>();
  title = input.required<string>();
  description = input<string | undefined>(undefined);
}
