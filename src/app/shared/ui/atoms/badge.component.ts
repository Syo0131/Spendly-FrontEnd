import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeTone = 'neutral' | 'income' | 'expense' | 'ok' | 'warning' | 'critical';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()">
      <ng-content />
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
  `]
})
export class BadgeComponent {
  tone = input<BadgeTone>('neutral');

  badgeClasses = computed(() => {
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-mono font-semibold tracking-wide border';

    const toneMap: Record<BadgeTone, string> = {
      neutral: 'bg-surface-raised border-border text-ink-muted',
      income: 'bg-income/10 border-income/30 text-income',
      expense: 'bg-expense/10 border-expense/30 text-expense',
      ok: 'bg-status-ok/10 border-status-ok/30 text-status-ok',
      warning: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
      critical: 'bg-status-critical/10 border-status-critical/30 text-status-critical animate-pulse',
    };

    return `${base} ${toneMap[this.tone()]}`;
  });
}
