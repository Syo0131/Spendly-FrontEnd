import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../atoms/icon.component';

export type CategoryBadgeSize = 'sm' | 'md';

function hexToRgba(hex: string | null | undefined, alpha: number): string | null {
  if (!hex || typeof hex !== 'string') return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return null;
}

@Component({
  selector: 'ui-category-badge',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full font-medium transition-colors select-none"
      [class.text-xs]="size() === 'sm'"
      [class.px-2]="size() === 'sm'"
      [class.py-0.5]="size() === 'sm'"
      [class.gap-1]="size() === 'sm'"
      [class.text-sm]="size() === 'md'"
      [class.px-2.5]="size() === 'md'"
      [class.py-1]="size() === 'md'"
      [class.gap-1.5]="size() === 'md'"
      [style.background-color]="bgStyle()"
      [style.border]="borderStyle()"
      [style.color]="'var(--fg-default)'"
    >
      <ui-icon
        [name]="icon()"
        [size]="size() === 'sm' ? 'sm' : 'md'"
        [style.color]="color() || 'var(--fg-muted)'"
      />
      <span class="truncate max-w-[120px]">{{ name() }}</span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class CategoryBadgeComponent {
  name = input.required<string>();
  color = input<string | null>(null);
  icon = input<string | null>(null);
  size = input<CategoryBadgeSize>('md');

  bgStyle = computed(() => {
    const c = this.color();
    return hexToRgba(c, 0.15) || 'rgba(var(--surface-muted), 0.8)';
  });

  borderStyle = computed(() => {
    const c = this.color();
    const borderRgba = hexToRgba(c, 0.25);
    return borderRgba ? `1px solid ${borderRgba}` : '1px solid rgba(var(--border-subtle), 0.5)';
  });
}
