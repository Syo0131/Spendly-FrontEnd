import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { resolveIconName } from '../../icons/lucide';

/**
 * Central icon component. Wraps lucide-angular and resolves legacy Material
 * Icons names (including data-driven `category.icons` from the backend) to
 * Lucide icons via `resolveIconName`.
 *
 * Color is inherited from the host's text color (Lucide draws with
 * `currentColor`), so existing utility classes like `text-primary`,
 * `text-content-muted`, etc. keep controlling the icon color.
 *
 * Usage:
 *   <app-icon name="dashboard" />                 // legacy Material name
 *   <app-icon name="chevron-left" [size]="18" />  // native Lucide name
 *   <app-icon [name]="category.icons" class="text-primary" />
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lucide-icon [name]="lucideName()" [size]="size()" [strokeWidth]="strokeWidth()" />`,
  host: {
    class: 'inline-flex items-center justify-center leading-none',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class IconComponent {
  /** Icon name — legacy Material Icons name or native Lucide (kebab-case) name. */
  readonly name = input.required<string>();
  /** Rendered size in pixels. */
  readonly size = input<number>(20);
  /** Stroke width of the Lucide glyph. */
  readonly strokeWidth = input<number>(2);

  protected readonly lucideName = computed(() => resolveIconName(this.name()));
}
