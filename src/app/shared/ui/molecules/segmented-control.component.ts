import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  forwardRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SegmentedControlOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'ui-segmented-control',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControlComponent),
      multi: true,
    },
  ],
  template: `
    <div
      role="radiogroup"
      class="inline-flex items-center gap-1 p-1 bg-surface-sunken border border-border rounded-lg select-none w-full sm:w-auto"
      (keydown)="onKeyDown($event)"
    >
      @for (opt of options(); track opt.value; let idx = $index) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="selectedValue() === opt.value"
          [attr.tabindex]="selectedValue() === opt.value ? 0 : -1"
          [disabled]="disabled()"
          (click)="select(opt.value)"
          class="flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          [class.bg-surface]="selectedValue() === opt.value"
          [class.text-ink]="selectedValue() === opt.value"
          [class.shadow-sm]="selectedValue() === opt.value"
          [class.text-ink-muted]="selectedValue() !== opt.value"
          [class.hover:text-ink]="selectedValue() !== opt.value"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class SegmentedControlComponent<T = unknown> implements ControlValueAccessor {
  options = input<SegmentedControlOption<T>[]>([]);
  value = input<T | undefined>(undefined);
  valueChange = output<T>();

  selectedValue = signal<T | null>(null);
  disabled = signal<boolean>(false);

  private onChange: (value: T) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined) {
        this.selectedValue.set(v);
      }
    });
  }

  select(val: T): void {
    if (this.disabled()) return;
    this.selectedValue.set(val);
    this.valueChange.emit(val);
    this.onChange(val);
    this.onTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const opts = this.options();
    if (opts.length === 0) return;

    const currentIdx = opts.findIndex((o) => o.value === this.selectedValue());

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIdx = (currentIdx + 1) % opts.length;
      const nextVal = opts[nextIdx].value;
      this.select(nextVal);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIdx = (currentIdx - 1 + opts.length) % opts.length;
      const prevVal = opts[prevIdx].value;
      this.select(prevVal);
    }
  }

  writeValue(value: T): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
