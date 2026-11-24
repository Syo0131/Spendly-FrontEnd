import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { resolveIcon } from './icon-map';

export type IconSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <span
        role="img"
        [attr.aria-label]="label()"
        [class]="classes()"
        >{{ resolvedName() }}</span>
    } @else {
      <span
        aria-hidden="true"
        [class]="classes()"
        >{{ resolvedName() }}</span>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  `]
})
export class IconComponent {
  name = input.required<string | null | undefined>();
  size = input<IconSize>('md');
  label = input<string | undefined>(undefined);
  customClass = input<string>('');

  resolvedName = computed(() => resolveIcon(this.name()));

  classes = computed(() => {
    const sizeClasses = {
      sm: 'text-base w-4 h-4 text-[16px]',
      md: 'text-xl w-5 h-5 text-[20px]',
      lg: 'text-2xl w-6 h-6 text-[24px]',
    }[this.size()];

    const extra = this.customClass();
    return `material-icons-outlined select-none flex items-center justify-center leading-none ${sizeClasses} ${extra}`.trim();
  });
}
