import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

export type AmountTone = 'neutral' | 'income' | 'expense';
export type AmountSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-amount',
  standalone: true,
  imports: [CommonModule],
  providers: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="amountClasses()">{{ formattedValue() }}</span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class AmountComponent {
  private currencyPipe = inject(CurrencyPipe);

  value = input.required<number>();
  tone = input<AmountTone>('neutral');
  type = input<AmountTone | undefined>(undefined);
  size = input<AmountSize>('md');
  locale = input<string>('es-DO');

  effectiveTone = computed<AmountTone>(() => this.type() ?? this.tone());

  formattedValue = computed(() => {
    const val = this.value();
    const loc = this.locale();
    // CurrencyPipe with code 'DOP' and 'symbol-narrow'
    try {
      const formatted = this.currencyPipe.transform(val, 'DOP', 'symbol-narrow', '1.2-2', loc);
      if (formatted) {
        // Ensure RD$ representation if Angular's default en locale returns generic symbol
        return formatted.includes('$') && !formatted.includes('RD$') && !formatted.includes('DOP')
          ? formatted.replace('$', 'RD$ ')
          : formatted;
      }
    } catch {
      // Fallback
    }

    try {
      return new Intl.NumberFormat(loc === 'en-US' ? 'es-DO' : loc, {
        style: 'currency',
        currency: 'DOP',
        currencyDisplay: 'symbol',
      }).format(val);
    } catch {
      return `RD$ ${val.toFixed(2)}`;
    }
  });

  amountClasses = computed(() => {
    const base = 'font-mono tabular-nums tracking-tight';

    const toneClasses: Record<AmountTone, string> = {
      neutral: 'text-ink',
      income: 'text-income',
      expense: 'text-expense',
    };

    const sizeClasses: Record<AmountSize, string> = {
      sm: 'text-xs',
      md: 'text-sm font-semibold',
      lg: 'text-lg font-bold',
      xl: 'text-2xl md:text-3xl font-extrabold',
    };

    return `${base} ${toneClasses[this.effectiveTone()]} ${sizeClasses[this.size()]}`.trim();
  });
}
