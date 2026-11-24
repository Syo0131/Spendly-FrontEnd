import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 mb-6 border-b border-border-subtle/50">
      <div class="min-w-0">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-fg-default font-heading truncate">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="text-sm text-fg-muted mt-1 leading-normal">
            {{ subtitle() }}
          </p>
        }
      </div>

      <div class="flex items-center gap-2.5 shrink-0 empty:hidden">
        <ng-content select="[uiHeaderActions]" />
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string | undefined>(undefined);
}
