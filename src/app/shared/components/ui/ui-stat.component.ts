import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { UiBadgeComponent, UiBadgeTone } from './ui-badge.component';

export type UiStatTone = 'ink' | 'success' | 'expense';

/**
 * Signature stat block: eyebrow label + large serif tabular figure, with an
 * optional delta chip and a faint decorative icon. `value` is a pre-formatted
 * string (format with a currency pipe at the call site).
 *
 *   <ui-stat label="Balance" [value]="balance() | currency:'DOP'" icon="account_balance_wallet"
 *            delta="+8.2%" deltaTone="success" />
 */
@Component({
  selector: 'ui-stat',
  standalone: true,
  imports: [IconComponent, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      @if (icon()) {
      <div
        class="mt-3 absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary-ink"
      >
        <app-icon [name]="icon()" [size]="25" />
      </div>
      }
      <p class="eyebrow">{{ label() }}</p>
      <p
        class="mt-2 pr-11 font-display text-2xl md:text-3xl font-semibold tabular tracking-tight break-words"
        [class]="valueClass()"
      >
        {{ value() }}
      </p>
      @if (delta()) {
      <div class="mt-3">
        <ui-badge [tone]="deltaTone()">{{ delta() }}</ui-badge>
      </div>
      }
    </div>
  `,
})
export class UiStatComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | null>();
  readonly tone = input<UiStatTone>('ink');
  readonly icon = input<string>('');
  readonly delta = input<string>('');
  readonly deltaTone = input<UiBadgeTone>('neutral');

  private readonly tones: Record<UiStatTone, string> = {
    ink: 'text-content',
    success: 'text-success',
    expense: 'text-expense',
  };
  protected readonly valueClass = computed(() => this.tones[this.tone()]);
}
