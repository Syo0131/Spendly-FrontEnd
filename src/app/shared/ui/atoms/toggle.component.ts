import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  forwardRef,
  effect,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true,
    },
  ],
  template: `
    <div class="inline-flex items-center gap-3">
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="checked()"
        [attr.aria-label]="label()"
        [disabled]="disabled()"
        (click)="toggle()"
        [class]="buttonClasses()"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-out shadow-sm"
          [class.translate-x-5]="checked()"
          [class.translate-x-0.5]="!checked()"
        ></span>
      </button>
      @if (label()) {
        <span class="text-sm font-medium text-ink select-none cursor-pointer" (click)="toggle()">
          {{ label() }}
        </span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ToggleComponent implements ControlValueAccessor {
  label = input<string>('');
  checkedInput = input<boolean | undefined>(undefined, { alias: 'checked' });
  change = output<boolean>();

  checked = signal<boolean>(false);
  disabled = signal<boolean>(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const val = this.checkedInput();
      if (val !== undefined) {
        this.checked.set(val);
      }
    });
  }

  toggle(): void {
    if (this.disabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.change.emit(next);
    this.onChange(next);
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  buttonClasses(): string {
    const base = 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed';
    const bg = this.checked() ? 'bg-accent' : 'bg-surface-raised border-border';
    return `${base} ${bg}`;
  }
}
