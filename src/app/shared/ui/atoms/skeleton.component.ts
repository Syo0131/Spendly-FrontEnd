import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type SkeletonShape = 'line' | 'block' | 'circle';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()" aria-hidden="true"></div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SkeletonComponent {
  shape = input<SkeletonShape>('line');
  customClass = input<string>('');

  classes = computed(() => {
    const base = 'animate-pulse bg-surface-raised border border-border/50';

    const shapeClasses: Record<SkeletonShape, string> = {
      line: 'h-4 w-full rounded-sm',
      block: 'h-24 w-full rounded-md',
      circle: 'h-10 w-10 rounded-full',
    };

    return `${base} ${shapeClasses[this.shape()]} ${this.customClass()}`.trim();
  });
}
