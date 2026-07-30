import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiProgressTone = 'brand' | 'success' | 'expense' | 'warning';

/**
 * Signature progress bar for budgets/goals. Rounded track + fill, tokenized tone.
 *   <ui-progress [value]="72" tone="warning" />
 */
@Component({
  selector: 'ui-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        class="h-full rounded-full transition-[width] duration-700 ease-out"
        [class]="fillClass()"
        [style.width.%]="clamped()"
      ></div>
    </div>
  `,
})
export class UiProgressComponent {
  readonly value = input<number>(0);
  readonly tone = input<UiProgressTone>('brand');

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value() || 0)));

  private readonly fills: Record<UiProgressTone, string> = {
    brand: 'bg-primary',
    success: 'bg-success',
    expense: 'bg-expense',
    warning: 'bg-warning',
  };
  protected readonly fillClass = computed(() => this.fills[this.tone()]);
}
