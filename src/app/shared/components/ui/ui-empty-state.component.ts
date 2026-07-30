import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Editorial empty state: soft icon medallion, serif title, muted copy and an
 * optional action slot.
 *
 *   <ui-empty-state icon="flag" title="Sin metas" description="Crea tu primera meta.">
 *     <ui-button (click)="add()">Nueva meta</ui-button>
 *   </ui-empty-state>
 */
@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center px-6 py-12 text-center">
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary-ink dark:text-primary-300"
      >
        <app-icon [name]="icon()" [size]="28" />
      </div>
      <h3 class="font-display text-xl font-semibold text-content">{{ title() }}</h3>
      @if (description()) {
      <p class="mt-1.5 max-w-sm text-sm text-content-muted">{{ description() }}</p>
      }
      <div class="mt-6 empty:hidden">
        <ng-content />
      </div>
    </div>
  `,
})
export class UiEmptyStateComponent {
  readonly icon = input<string>('shapes');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
