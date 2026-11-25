import { Component, ChangeDetectionStrategy, input, computed, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[uiButton], a[uiButton]',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <ui-spinner [size]="spinnerSize()" />
    }
    <ng-content />
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      line-height: 1.25;
      cursor: pointer;
      user-select: none;
      transition: background-color 100ms ease-out, border-color 100ms ease-out, color 100ms ease-out, transform 75ms ease-out;
    }
    :host:active:not(:disabled) {
      transform: scale(0.98);
    }
    :host:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  `]
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);

  @HostBinding('attr.aria-busy')
  get ariaBusy(): boolean | null {
    return this.loading() ? true : null;
  }

  @HostBinding('disabled')
  get isDisabled(): boolean {
    return this.disabled() || this.loading();
  }

  spinnerSize = computed<'sm' | 'md' | 'lg'>(() => {
    return this.size() === 'lg' ? 'md' : 'sm';
  });

  @HostBinding('class')
  get hostClasses(): string {
    const base = 'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-accent text-accent-contrast hover:opacity-90 active:opacity-95 shadow-sm',
      secondary: 'bg-surface border border-border text-ink hover:bg-surface-raised active:bg-surface-sunken shadow-sm',
      ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-surface-raised active:bg-surface-sunken',
      danger: 'bg-expense text-white hover:opacity-90 active:opacity-95 shadow-sm',
    };

    return `${base} ${sizeClasses[this.size()]} ${variantClasses[this.variant()]}`.trim();
  }
}
