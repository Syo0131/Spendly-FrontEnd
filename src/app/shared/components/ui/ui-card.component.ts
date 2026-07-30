import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Editorial surface — the signature card of the design system.
 * Solid warm surface, thin warm border, soft realistic shadow, generous radius.
 * Replaces the old glassmorphism `glass-card`.
 *
 *   <ui-card>…</ui-card>
 *   <ui-card [interactive]="true">…</ui-card>   // hover lift (clickable)
 *   <ui-card [padded]="false">…</ui-card>       // manage padding yourself
 */
@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { '[class]': 'classes()' },
})
export class UiCardComponent {
  /** Adds hover lift + pointer affordance for clickable cards. */
  readonly interactive = input(false);
  /** Default inner padding; set false to control spacing yourself. */
  readonly padded = input(true);

  protected readonly classes = computed(() =>
    [
      'block rounded-2xl border border-divider bg-surface-2 transition-all duration-200',
      this.padded() ? 'p-5 sm:p-6' : '',
      this.interactive()
        ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_34px_-8px_rgba(43,38,32,0.18)] dark:hover:shadow-[0_10px_34px_-8px_rgba(0,0,0,0.5)]'
        : 'shadow-[0_1px_2px_rgba(43,38,32,0.05)]',
    ].join(' ')
  );
}
