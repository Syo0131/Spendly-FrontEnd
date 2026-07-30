import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type UiButtonVariant = 'primary' | 'soft' | 'ghost' | 'ink' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

/**
 * Editorial button. Terracotta-led, tactile press, accessible focus ring.
 *
 *   <ui-button (click)="save()">Guardar</ui-button>
 *   <ui-button variant="soft" size="sm">Filtrar</ui-button>
 *   <ui-button [loading]="saving()">Guardar</ui-button>
 *
 * (click) bubbles from the inner <button>, so bind it on <ui-button> directly.
 */
@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="disabled() || loading()" [class]="classes()">
      @if (loading()) {
      <app-icon name="sync" [size]="iconSize()" class="animate-spin" />
      }
      <ng-content />
    </button>
  `,
  host: { '[class.block]': 'block()', '[class.inline-block]': '!block()' },
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  /** Full-width button. */
  readonly block = input(false);

  protected readonly iconSize = computed(() => (this.size() === 'lg' ? 20 : 16));

  private readonly base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight ' +
    'transition-all duration-150 active:scale-[0.98] focus:outline-none ' +
    'focus-visible:ring-4 focus-visible:ring-primary/25 ' +
    'disabled:opacity-50 disabled:pointer-events-none';

  private readonly sizes: Record<UiButtonSize, string> = {
    sm: 'px-3.5 py-2 text-[13px]',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  private readonly variants: Record<UiButtonVariant, string> = {
    primary: 'bg-primary text-primary-on shadow-sm shadow-primary/25 hover:bg-primary-dark',
    soft: 'bg-primary/10 text-primary-ink hover:bg-primary/15 dark:text-primary-300',
    ghost: 'text-content-muted hover:bg-surface-3 hover:text-content',
    ink: 'bg-content text-surface hover:opacity-90',
    danger: 'bg-expense text-white hover:opacity-90',
  };

  protected readonly classes = computed(() =>
    [this.base, this.sizes[this.size()], this.variants[this.variant()], this.block() ? 'w-full' : ''].join(' ')
  );
}
