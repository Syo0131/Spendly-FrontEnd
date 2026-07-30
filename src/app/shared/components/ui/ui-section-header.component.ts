import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Editorial section header: small uppercase eyebrow + serif display title,
 * with an optional actions slot on the right.
 *
 *   <ui-section-header eyebrow="Julio 2026" title="Resumen">
 *     <ui-button size="sm">Exportar</ui-button>
 *   </ui-section-header>
 */
@Component({
  selector: 'ui-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-end justify-between gap-4">
      <div>
        @if (eyebrow()) {
        <p class="eyebrow mb-1">{{ eyebrow() }}</p>
        }
        <h2 class="font-display text-2xl font-semibold tracking-tight text-content">
          {{ title() }}
        </h2>
        @if (subtitle()) {
        <p class="mt-1 text-sm text-content-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="shrink-0">
        <ng-content />
      </div>
    </div>
  `,
})
export class UiSectionHeaderComponent {
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
