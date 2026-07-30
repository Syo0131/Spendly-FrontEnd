import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiBadgeTone = 'neutral' | 'brand' | 'success' | 'expense' | 'warning';

/**
 * Small pill/chip for statuses, deltas and labels.
 *   <ui-badge tone="success">+8.2%</ui-badge>
 */
@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { '[class]': 'classes()' },
})
export class UiBadgeComponent {
  readonly tone = input<UiBadgeTone>('neutral');

  private readonly base =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

  private readonly tones: Record<UiBadgeTone, string> = {
    neutral: 'bg-surface-3 text-content-muted',
    brand: 'bg-primary/10 text-primary-ink dark:text-primary-300',
    success: 'bg-success/12 text-success',
    expense: 'bg-expense/12 text-expense',
    warning: 'bg-warning/15 text-warning',
  };

  protected readonly classes = computed(() => `${this.base} ${this.tones[this.tone()]}`);
}
