import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetStatus } from '../../../core/utils/budget-status';

export type ProgressBarThickness = 'thin' | 'regular';

@Component({
  selector: 'ui-progress-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="progressbar"
      [attr.aria-valuenow]="ariaValueNow()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-label]="label()"
      [class]="trackClasses()"
    >
      <div
        class="progress-fill h-full rounded-sm transition-all duration-300"
        [class]="fillClasses()"
        [style.width]="clampedWidth()"
      ></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ProgressBarComponent {
  percent = input.required<number>();
  status = input<BudgetStatus | 'neutral'>('neutral');
  thickness = input<ProgressBarThickness>('regular');
  label = input.required<string>();

  ariaValueNow = computed(() => {
    return String(Math.round(this.percent()));
  });

  clampedWidth = computed(() => {
    const raw = this.percent();
    const clamped = Math.max(0, Math.min(100, raw));
    return `${clamped}%`;
  });

  trackClasses = computed(() => {
    const height = this.thickness() === 'thin' ? 'h-1.5' : 'h-2';
    return `w-full bg-track rounded-sm overflow-hidden flex ${height}`;
  });

  fillClasses = computed(() => {
    const statusMap: Record<BudgetStatus | 'neutral', string> = {
      ok: 'bg-status-ok',
      warning: 'bg-status-warning',
      critical: 'bg-status-critical',
      neutral: 'bg-bar-neutral',
    };
    return statusMap[this.status()];
  });
}
