import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CurrencyInputDirective } from '../../directives/currency-input.directive';

@Component({
  selector: 'ui-currency-input',
  standalone: true,
  imports: [CommonModule, CurrencyInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full flex items-center">
      <span class="absolute left-3 font-mono text-xs font-semibold text-ink-muted select-none pointer-events-none">
        RD$
      </span>
      <input
        appCurrencyInput
        [id]="inputId()"
        type="text"
        inputmode="decimal"
        [placeholder]="placeholder()"
        [value]="displayValue()"
        [disabled]="disabled()"
        (input)="onInputChange($event)"
        (blur)="onBlur()"
        class="w-full h-10 pl-12 pr-3 bg-surface border border-border text-ink font-mono tabular-nums text-sm rounded-md shadow-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent disabled:opacity-50 transition-colors"
      />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CurrencyInputComponent implements ControlValueAccessor {
  inputId = input.required<string>();
  placeholder = input<string>('0.00');

  displayValue = signal<string>('');
  disabled = signal<boolean>(false);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.displayValue.set(raw);
    const parsed = parseFloat(raw);
    this.onChange(isNaN(parsed) ? null : parsed);
  }

  onBlur(): void {
    const raw = this.displayValue();
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      this.displayValue.set(parsed.toFixed(2));
      this.onChange(parsed);
    }
    this.onTouched();
  }

  writeValue(value: number | null): void {
    if (value !== null && value !== undefined && !isNaN(value)) {
      this.displayValue.set(value.toFixed(2));
    } else {
      this.displayValue.set('');
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
